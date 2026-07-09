import {
  prisma,
  type Disciplina,
  type LaminaTipo,
  type DocumentoConocimientoTipo,
  type ReglaCategoria,
} from "@diego-porras/database";
import { classifyLaminaContent, parseNotasTexto } from "@diego-porras/ctk";
import { extractPdfText, isPdfFile } from "@/lib/pdf";
import { extractTextWithOcr, needsOcr } from "@/lib/ocr";

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

export async function procesarLamina(laminaId: string): Promise<void> {
  const lamina = await prisma.lamina.findUnique({ where: { id: laminaId } });
  if (!lamina) throw new Error(`Lámina no encontrada: ${laminaId}`);

  await prisma.lamina.update({
    where: { id: laminaId },
    data: { estadoProcesamiento: "PROCESANDO" },
  });

  try {
    const res = await fetch(lamina.archivoUrl);
    if (!res.ok) {
      throw new Error(`No se pudo descargar el archivo (${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let textSample = "";
    let pages = 0;
    let source: "unpdf" | "ocr" | "none" = "none";
    let motivo: string | undefined;

    if (isPdfFile(lamina.archivoNombre, res.headers.get("content-type"))) {
      const extracted = await extractPdfText(buffer);
      textSample = extracted.text.slice(0, 8000);
      pages = extracted.pages;
      if (textSample.length > 0) source = "unpdf";

      if (needsOcr(textSample)) {
        const ocr = await extractTextWithOcr(buffer, lamina.archivoNombre);
        if (ocr && ocr.text.trim().length > 0) {
          textSample = ocr.text.slice(0, 8000);
          pages = ocr.pages || pages;
          source = "ocr";
        } else {
          motivo = "sin_texto_ocr_pendiente";
        }
      }
    } else {
      // Images: OCR deferred
      motivo = "sin_texto_ocr_pendiente";
    }

    const classified = classifyLaminaContent(
      lamina.archivoNombre,
      textSample || lamina.archivoNombre
    );
    const disciplina = asDisciplina(classified.disciplina, lamina.disciplina);
    const tipo = asTipo(classified.tipo, lamina.tipo);

    // Clear previous auto-generated elements for reprocessing
    await prisma.elementoPlano.deleteMany({
      where: { laminaId, tipo: "TEXTO" },
    });

    if (textSample.length > 0) {
      await prisma.elementoPlano.create({
        data: {
          laminaId,
          tipo: "TEXTO",
          textoExtraido: textSample.slice(0, 4000),
          metadataJson: { pages, source },
        },
      });
    }

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
            proyectoId: lamina.proyectoId,
            laminaId,
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
            laminaId,
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
      textSample.length > 0 || reglasCreadas > 0
        ? "ANALIZADO"
        : motivo
          ? "PENDIENTE"
          : "PENDIENTE";

    const prevMeta =
      lamina.metadataJson && typeof lamina.metadataJson === "object"
        ? (lamina.metadataJson as Record<string, unknown>)
        : {};

    await prisma.lamina.update({
      where: { id: laminaId },
      data: {
        disciplina,
        tipo,
        estadoProcesamiento: estadoFinal,
        metadataJson: {
          ...prevMeta,
          classified,
          pages,
          textLength: textSample.length,
          hasText: textSample.length > 0,
          source,
          reglasCreadas,
          ...(motivo ? { motivo } : {}),
        },
      },
    });
  } catch (e) {
    console.error(`procesarLamina(${laminaId}) failed:`, e);
    const prevMeta =
      lamina.metadataJson && typeof lamina.metadataJson === "object"
        ? (lamina.metadataJson as Record<string, unknown>)
        : {};
    await prisma.lamina.update({
      where: { id: laminaId },
      data: {
        estadoProcesamiento: "ERROR",
        metadataJson: {
          ...prevMeta,
          motivo: e instanceof Error ? e.message : "error_procesamiento",
        },
      },
    });
    throw e;
  }
}
