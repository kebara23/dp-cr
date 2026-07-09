import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  pages: number;
}> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      text: result.text?.trim() ?? "",
      pages: result.total ?? result.pages?.length ?? 0,
    };
  } catch (e) {
    console.error("PDF text extraction failed:", e);
    return { text: "", pages: 0 };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export function isPdfFile(filename: string, mimeType?: string | null): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith(".pdf") || mimeType === "application/pdf";
}
