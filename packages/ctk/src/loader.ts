import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import type { PackMetadata, DocumentoCtk, ReglaCtk, FilaTablaCtk } from "./types.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PACKS_DIR = join(__dirname, "../../../data/ctk-packs");

export async function loadPackMetadata(packId: string): Promise<PackMetadata> {
  const manifestPath = join(PACKS_DIR, packId, "manifest.json");
  const content = readFileSync(manifestPath, "utf-8");
  return JSON.parse(content) as PackMetadata;
}

export async function loadPackDocument(packId: string, filename: string): Promise<DocumentoCtk> {
  const docPath = join(PACKS_DIR, packId, filename);
  const content = readFileSync(docPath, "utf-8");
  return JSON.parse(content) as DocumentoCtk;
}

export async function loadEntirePackCrResidencial(): Promise<{
  metadata: PackMetadata;
  documentos: Map<string, DocumentoCtk>;
}> {
  const metadata = await loadPackMetadata("cr-residencial-v1");
  const documentos = new Map<string, DocumentoCtk>();

  for (const archivo of metadata.archivos) {
    const doc = await loadPackDocument("cr-residencial-v1", archivo);
    documentos.set(archivo, doc);
  }

  return { metadata, documentos };
}

// Extrae todas las reglas técnicas del pack.
export async function extractAllReglas(packData: Awaited<ReturnType<typeof loadEntirePackCrResidencial>>): Promise<ReglaCtk[]> {
  const reglas: ReglaCtk[] = [];
  for (const doc of packData.documentos.values()) {
    if (doc.reglas) {
      reglas.push(...doc.reglas);
    }
  }
  return reglas;
}

// Extrae todas las filas de tabla del pack.
export async function extractAllTablas(packData: Awaited<ReturnType<typeof loadEntirePackCrResidencial>>): Promise<FilaTablaCtk[]> {
  const tablas: FilaTablaCtk[] = [];
  for (const doc of packData.documentos.values()) {
    if (doc.tablas) {
      tablas.push(...doc.tablas);
    }
  }
  return tablas;
}
