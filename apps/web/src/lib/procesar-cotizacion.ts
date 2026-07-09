import ExcelJS from "exceljs";
import { prisma } from "@diego-porras/database";
import { extractPdfText, isPdfFile } from "@/lib/pdf";
import { matchMaterial } from "@/lib/matching-materiales";

export interface LineaParseada {
  descripcion: string;
  unidad: string | null;
  cantidad: number | null;
  precioUnitario: number;
  subtotal: number;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[₡$]/g, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function headerKey(cell: unknown): string {
  return String(cell ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function parseXlsx(buffer: Buffer): Promise<LineaParseada[]> {
  const wb = new ExcelJS.Workbook();
  // exceljs accepts Buffer / ArrayBuffer
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const headerRow = ws.getRow(1);
  const colMap: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    const h = headerKey(cell.value);
    if (h.includes("desc")) colMap.descripcion = col;
    else if (h.includes("und") || h.includes("unidad")) colMap.unidad = col;
    else if (h.includes("cant")) colMap.cantidad = col;
    else if (h.includes("precio") || h.includes("p. unit") || h.includes("p unit"))
      colMap.precio = col;
    else if (h.includes("subtotal") || h.includes("total")) colMap.subtotal = col;
  });

  // Fallback columns if headers missing
  if (!colMap.descripcion) colMap.descripcion = 2;
  if (!colMap.unidad) colMap.unidad = 3;
  if (!colMap.cantidad) colMap.cantidad = 4;
  if (!colMap.precio) colMap.precio = 6;
  if (!colMap.subtotal) colMap.subtotal = 7;

  const lineas: LineaParseada[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const descripcion = String(row.getCell(colMap.descripcion).value ?? "").trim();
    if (!descripcion || descripcion.toLowerCase().startsWith("ronda:")) return;
    if (descripcion.toLowerCase().includes("complete las columnas")) return;

    const cantidad = parseNumber(row.getCell(colMap.cantidad).value);
    const precioUnitario = parseNumber(row.getCell(colMap.precio).value) ?? 0;
    if (precioUnitario <= 0) return;

    const unidadRaw = row.getCell(colMap.unidad).value;
    const unidad = unidadRaw != null ? String(unidadRaw).trim() || null : null;
    const subtotalParsed = parseNumber(row.getCell(colMap.subtotal).value);
    const subtotal =
      subtotalParsed ??
      Math.round((cantidad ?? 1) * precioUnitario * 100) / 100;

    lineas.push({
      descripcion,
      unidad,
      cantidad,
      precioUnitario,
      subtotal,
    });
  });

  return lineas;
}

function parsePdfTextLines(text: string): LineaParseada[] {
  const lineas: LineaParseada[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Ej: "Cemento Portland  10  saco  4500  45000"
    const m = line.match(
      /^(.+?)\s+(\d+(?:[.,]\d+)?)\s+([a-zA-Z³°/#"]+)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)\s*$/
    );
    if (!m) continue;
    const descripcion = m[1].trim();
    const cantidad = parseNumber(m[2]);
    const unidad = m[3];
    const precioUnitario = parseNumber(m[4]) ?? 0;
    const subtotal = parseNumber(m[5]) ?? 0;
    if (!descripcion || precioUnitario <= 0) continue;
    lineas.push({
      descripcion,
      unidad,
      cantidad,
      precioUnitario,
      subtotal: subtotal || Math.round((cantidad ?? 1) * precioUnitario * 100) / 100,
    });
  }
  return lineas;
}

export async function procesarCotizacion(cotizacionId: string): Promise<void> {
  const cotizacion = await prisma.cotizacionFerreteria.findUnique({
    where: { id: cotizacionId },
    include: {
      ronda: { include: { lineasMaterial: true } },
    },
  });
  if (!cotizacion) throw new Error(`Cotización no encontrada: ${cotizacionId}`);

  await prisma.cotizacionFerreteria.update({
    where: { id: cotizacionId },
    data: { estadoProcesamiento: "PROCESANDO" },
  });

  try {
    const res = await fetch(cotizacion.archivoUrl);
    if (!res.ok) throw new Error(`No se pudo descargar (${res.status})`);
    const buffer = Buffer.from(await res.arrayBuffer());

    let lineas: LineaParseada[] = [];
    const formato = cotizacion.formato.toLowerCase();
    const nombre = cotizacion.archivoNombre.toLowerCase();

    if (formato === "xlsx" || nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) {
      lineas = await parseXlsx(buffer);
    } else if (formato === "pdf" || isPdfFile(nombre) || nombre.endsWith(".pdf")) {
      const extracted = await extractPdfText(buffer);
      lineas = parsePdfTextLines(extracted.text ?? "");
      if (lineas.length === 0 && !(extracted.text ?? "").trim()) {
        await prisma.cotizacionFerreteria.update({
          where: { id: cotizacionId },
          data: {
            estadoProcesamiento: "PENDIENTE",
            metadataJson: { motivo: "sin_texto_ocr_pendiente" },
          },
        });
        return;
      }
    } else if (formato === "png" || formato === "jpg" || formato === "jpeg") {
      await prisma.cotizacionFerreteria.update({
        where: { id: cotizacionId },
        data: {
          estadoProcesamiento: "PENDIENTE",
          metadataJson: { motivo: "sin_texto_ocr_pendiente" },
        },
      });
      return;
    } else {
      throw new Error(`Formato no soportado: ${formato}`);
    }

    const materiales = cotizacion.ronda.lineasMaterial.map((m) => ({
      id: m.id,
      descripcion: m.descripcion,
    }));

    await prisma.lineaCotizacionFerreteria.deleteMany({
      where: { cotizacionId },
    });

    if (lineas.length > 0) {
      await prisma.lineaCotizacionFerreteria.createMany({
        data: lineas.map((l) => {
          const match = matchMaterial(l.descripcion, materiales);
          return {
            cotizacionId,
            lineaMaterialId: match.lineaMaterialId,
            descripcionOriginal: l.descripcion,
            unidad: l.unidad,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            subtotal: l.subtotal,
            matchConfianza: match.confianza,
            matchManual: false,
          };
        }),
      });
    }

    await prisma.cotizacionFerreteria.update({
      where: { id: cotizacionId },
      data: {
        estadoProcesamiento: "ANALIZADO",
        metadataJson: { lineas: lineas.length },
      },
    });

    await prisma.rondaCotizacion.update({
      where: { id: cotizacion.rondaId },
      data: { estado: "EN_COMPARACION" },
    });
  } catch (e) {
    console.error("procesarCotizacion", e);
    await prisma.cotizacionFerreteria.update({
      where: { id: cotizacionId },
      data: {
        estadoProcesamiento: "ERROR",
        metadataJson: {
          error: e instanceof Error ? e.message : "Error desconocido",
        },
      },
    });
  }
}
