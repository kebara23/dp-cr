export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  pages: number;
}> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const data = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(data);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    const merged = typeof text === "string" ? text : (text as string[]).join("\n");
    return {
      text: merged.trim(),
      pages: totalPages ?? 0,
    };
  } catch (e) {
    console.error("PDF text extraction failed:", e);
    return { text: "", pages: 0 };
  }
}

export function isPdfFile(filename: string, mimeType?: string | null): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith(".pdf") || mimeType === "application/pdf";
}
