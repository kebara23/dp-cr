import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface MaterialExportRow {
  origenPartida: string | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  categoria: string | null;
}

export async function buildMaterialesXlsx(
  nombreRonda: string,
  materiales: MaterialExportRow[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DP-CR";
  const ws = wb.addWorksheet("Materiales");

  ws.columns = [
    { header: "Partida origen", key: "origenPartida", width: 14 },
    { header: "Descripción", key: "descripcion", width: 42 },
    { header: "Unidad", key: "unidad", width: 10 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "Categoría", key: "categoria", width: 14 },
    { header: "Precio unitario", key: "precio", width: 16 },
    { header: "Subtotal", key: "subtotal", width: 14 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  for (const m of materiales) {
    ws.addRow({
      origenPartida: m.origenPartida ?? "",
      descripcion: m.descripcion,
      unidad: m.unidad,
      cantidad: m.cantidad,
      categoria: m.categoria ?? "",
      precio: "",
      subtotal: "",
    });
  }

  ws.addRow([]);
  ws.addRow([`Ronda: ${nombreRonda}`]);
  ws.addRow(["Complete las columnas Precio unitario y Subtotal y devuelva este archivo."]);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildMaterialesPdf(
  nombreRonda: string,
  materiales: MaterialExportRow[]
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([612, 792]);
  let y = 750;

  const drawText = (text: string, x: number, size = 10, bold = false) => {
    page.drawText(text.slice(0, 90), {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.15),
    });
  };

  drawText("Lista de materiales para cotización", 40, 16, true);
  y -= 22;
  drawText(nombreRonda, 40, 11);
  y -= 28;

  drawText("Partida", 40, 9, true);
  drawText("Descripción", 100, 9, true);
  drawText("Und", 380, 9, true);
  drawText("Cant", 420, 9, true);
  drawText("P.Unit", 470, 9, true);
  y -= 14;
  page.drawLine({
    start: { x: 40, y },
    end: { x: 570, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.75),
  });
  y -= 14;

  for (const m of materiales) {
    if (y < 60) {
      page = doc.addPage([612, 792]);
      y = 750;
    }
    drawText(m.origenPartida ?? "—", 40, 9);
    drawText(m.descripcion, 100, 9);
    drawText(m.unidad, 380, 9);
    drawText(String(m.cantidad), 420, 9);
    drawText("______", 470, 9);
    y -= 14;
  }

  y -= 20;
  if (y < 80) {
    page = doc.addPage([612, 792]);
    y = 750;
  }
  drawText("Complete el precio unitario y devuelva esta cotización.", 40, 9);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export interface FacturaMixtaExportLinea {
  ferreteriaNombre: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export async function buildFacturaMixtaXlsx(
  nombreRonda: string,
  lineas: FacturaMixtaExportLinea[],
  totales: { totalOptimizado: number; totalMejorGlobal: number; ahorroEstimado: number }
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Factura mixta");

  ws.columns = [
    { header: "Ferretería", key: "ferreteria", width: 24 },
    { header: "Descripción", key: "descripcion", width: 40 },
    { header: "Unidad", key: "unidad", width: 10 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "P. Unitario", key: "precio", width: 14 },
    { header: "Subtotal", key: "subtotal", width: 14 },
  ];
  ws.getRow(1).font = { bold: true };

  const sorted = [...lineas].sort((a, b) =>
    a.ferreteriaNombre.localeCompare(b.ferreteriaNombre, "es")
  );
  for (const l of sorted) {
    ws.addRow({
      ferreteria: l.ferreteriaNombre,
      descripcion: l.descripcion,
      unidad: l.unidad,
      cantidad: l.cantidad,
      precio: l.precioUnitario,
      subtotal: l.subtotal,
    });
  }

  ws.addRow([]);
  ws.addRow(["Ronda", nombreRonda]);
  ws.addRow(["Total optimizado", totales.totalOptimizado]);
  ws.addRow(["Mejor ferretería única", totales.totalMejorGlobal]);
  ws.addRow(["Ahorro estimado", totales.ahorroEstimado]);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function buildFacturaMixtaPdf(
  nombreRonda: string,
  lineas: FacturaMixtaExportLinea[],
  totales: { totalOptimizado: number; totalMejorGlobal: number; ahorroEstimado: number }
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([612, 792]);
  let y = 750;

  const draw = (text: string, x: number, size = 10, bold = false) => {
    page.drawText(text.slice(0, 95), {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.15),
    });
  };

  draw("Factura mixta optimizada", 40, 16, true);
  y -= 20;
  draw(nombreRonda, 40, 11);
  y -= 24;

  const byFerreteria = new Map<string, FacturaMixtaExportLinea[]>();
  for (const l of lineas) {
    const arr = byFerreteria.get(l.ferreteriaNombre) ?? [];
    arr.push(l);
    byFerreteria.set(l.ferreteriaNombre, arr);
  }

  for (const [nombre, items] of byFerreteria) {
    if (y < 100) {
      page = doc.addPage([612, 792]);
      y = 750;
    }
    const sub = items.reduce((s, i) => s + i.subtotal, 0);
    draw(`${nombre} — ₡${sub.toLocaleString("es-CR")}`, 40, 11, true);
    y -= 16;
    for (const i of items) {
      if (y < 50) {
        page = doc.addPage([612, 792]);
        y = 750;
      }
      draw(
        `${i.descripcion} | ${i.cantidad} ${i.unidad} × ₡${i.precioUnitario.toLocaleString("es-CR")} = ₡${i.subtotal.toLocaleString("es-CR")}`,
        50,
        9
      );
      y -= 13;
    }
    y -= 10;
  }

  if (y < 90) {
    page = doc.addPage([612, 792]);
    y = 750;
  }
  draw(`Total optimizado: ₡${totales.totalOptimizado.toLocaleString("es-CR")}`, 40, 11, true);
  y -= 14;
  draw(`Mejor ferretería única: ₡${totales.totalMejorGlobal.toLocaleString("es-CR")}`, 40, 10);
  y -= 14;
  draw(`Ahorro estimado: ₡${totales.ahorroEstimado.toLocaleString("es-CR")}`, 40, 10, true);

  return Buffer.from(await doc.save());
}
