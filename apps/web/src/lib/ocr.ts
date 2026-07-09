/**
 * OCR wrapper — Fase A: deferred.
 * External OCR (Google Document AI / Azure DI) is not wired yet.
 * When text extraction via unpdf yields insufficient content, the job
 * marks the lamina as PENDIENTE with motivo "sin_texto_ocr_pendiente".
 *
 * Hook for Fase B: implement extractTextWithOcr(buffer) calling a paid provider.
 */

export type OcrResult = {
  text: string;
  pages: number;
  provider: string;
} | null;

const TEXT_THRESHOLD = 40;

export function needsOcr(text: string): boolean {
  return text.trim().length < TEXT_THRESHOLD;
}

/**
 * Placeholder OCR. Returns null until an external provider is configured
 * via OCR_PROVIDER + credentials env vars.
 */
export async function extractTextWithOcr(
  _buffer: Buffer,
  _filename: string
): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER;
  if (!provider) {
    return null;
  }

  // Future: Google Document AI / Azure Document Intelligence
  console.warn(
    `OCR_PROVIDER=${provider} configured but not implemented yet — deferring OCR`
  );
  return null;
}

export { TEXT_THRESHOLD };
