import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  type Disciplina,
  type LaminaTipo,
  type DocumentoConocimientoTipo,
  type ReglaCategoria,
} from "@diego-porras/database";
import { laminaSchema } from "@diego-porras/shared";
import { classifyLaminaContent, parseNotasTexto } from "@diego-porras/ctk";
import { requireSession, logAuditoria } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import { extractPdfText, isPdfFile } from "@/lib/pdf";

const DISCIPLINAS: Disciplina[] = [
  "ARQUITECTURA",
  "ESTRUCTURA",
  "ELECTRICO",
  "SANITARIO_MECANICO",
  "GENERAL",
  "NOTAS",
  "TABLA",
  "SIMBOLOGIA",
  "DETALLE",
];

const TIPOS: LaminaTipo[] = [
  "ARQUITECTURA",
  "ESTRUCTURA",
  "ELECTRICO",
  "SANITARIO_MECANICO",
  "NOTAS",
  "TABLA",
  "SIMBOLOGIA",
  "DETALLE",
  "OTRO",
];

function asDisciplina(value: string, fallback: Disciplina): Disciplina {
  return DISCIPLINAS.includes(value as Disciplina) ? (value as Disciplina) : fallback;
}

function asTipo(value: string, fallback: LaminaTipo): LaminaTipo {
  return TIPOS.includes(value as LaminaTipo) ? (value as LaminaTipo) : fallback;
}

function documentoTipoFor(disciplina: Disciplina, tipo: LaminaTipo): DocumentoConocimientoTipo {
  if (tipo === "TABLA") {
    if (disciplina === "ELECTRICO") return "TABLA_CENTRO_CARGA";
    if (disciplina === "ESTRUCTURA") return "TABLA_ACERO";
    return "OTRO";
  }
  if (tipo === "SIMBOLOGIA") {
    if (disciplina === "ELECTRICO") return "SIMBOLOGIA_ELECTRICA";
    if (disciplina === "SANITARIO_MECANICO") return "SIMBOLOGIA_MECANICA";
    return "OTRO";
  }
  if (disciplina === "ELECTRICO") return "NOTAS_ELECTRICAS";
  if (disciplina === "ESTRUCTURA") return "NOTAS_ESTRUCTURALES";
  if (disciplina === "SANITARIO_MECANICO") return "NOTAS_MECANICAS";
  return "NOTAS_GENERALES";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const laminas = await prisma.lamina.findMany({
      where: { proyectoId: id },
      include: { _count: { select: { elementos: true } } },
      orderBy: { codigo: "asc" },
    });
    return NextResponse.json(laminas);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const metadata = formData.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const meta = metadata ? JSON.parse(metadata) : {};
    const parsed = laminaSchema.safeParse(meta);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const archivoUrl = await saveUploadedFile(
      proyectoId,
      file.name,
      buffer,
      file.type || undefined
    );

    // Extract text from PDF when possible
    let textSample = "";
    let pages = 0;
    if (isPdfFile(file.name, file.type)) {
      const extracted = await extractPdfText(buffer);
      textSample = extracted.text.slice(0, 8000);
      pages = extracted.pages;
    }

    const classified = classifyLaminaContent(file.name, textSample || file.name);
    const disciplina = asDisciplina(classified.disciplina, parsed.data.disciplina);
    const tipo = asTipo(classified.tipo, parsed.data.tipo);

    const lamina = await prisma.lamina.create({
      data: {
        proyectoId,
        codigo: parsed.data.codigo,
        nombre: parsed.data.nombre,
        disciplina,
        tipo,
        escala: parsed.data.escala,
        revision: parsed.data.revision,
        archivoUrl,
        archivoNombre: file.name,
        estadoProcesamiento: "PROCESANDO",
        metadataJson: {
          classified,
          size: file.size,
          pages,
          textLength: textSample.length,
          hasText: textSample.length > 0,
        },
      },
    });

    // Persist extracted text as ElementoPlano
    if (textSample.length > 0) {
      await prisma.elementoPlano.create({
        data: {
          laminaId: lamina.id,
          tipo: "TEXTO",
          textoExtraido: textSample.slice(0, 4000),
          metadataJson: { pages, source: "pdf-parse" },
        },
      });
    }

    // If notes-like content, parse numbered rules into CTK documents
    let reglasCreadas = 0;
    if (tipo === "NOTAS" || textSample.match(/^\d+\.\s+/m)) {
      const reglas = parseNotasTexto(
        textSample,
        disciplina,
        lamina.codigo.replace(/[^A-Z0-9]/gi, "").slice(0, 8) || "LAM"
      );

      if (reglas.length > 0) {
        const documento = await prisma.documentoConocimiento.create({
          data: {
            proyectoId,
            laminaId: lamina.id,
            tipo: documentoTipoFor(disciplina, tipo),
            disciplina,
            origen: "LAMINA_PROYECTO",
            titulo: `${lamina.codigo} — ${lamina.nombre}`,
            textoCompleto: textSample.slice(0, 20000),
            estado: "PARSEADO",
          },
        });

        await prisma.reglaTecnica.createMany({
          data: reglas.map((r) => ({
            documentoId: documento.id,
            laminaId: lamina.id,
            codigo: r.codigo,
            numero: r.numero,
            categoria: (r.categoria as ReglaCategoria) || "NORMATIVA",
            disciplina,
            textoOriginal: r.textoOriginal,
            activo: true,
          })),
        });
        reglasCreadas = reglas.length;
      }
    }

    const estadoFinal =
      textSample.length > 0 || reglasCreadas > 0 ? "ANALIZADO" : "PENDIENTE";

    const updated = await prisma.lamina.update({
      where: { id: lamina.id },
      data: {
        estadoProcesamiento: estadoFinal,
        metadataJson: {
          classified,
          size: file.size,
          pages,
          textLength: textSample.length,
          hasText: textSample.length > 0,
          reglasCreadas,
        },
      },
      include: { _count: { select: { elementos: true, documentosConocimiento: true } } },
    });

    await logAuditoria("UPLOAD", "Lamina", session.id, proyectoId, lamina.id, {
      codigo: lamina.codigo,
      estado: estadoFinal,
      reglasCreadas,
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Error al subir";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
