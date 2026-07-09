import type { CtkPack, CtkRegla, CtkSimbolo, CtkTablaFila } from "@diego-porras/shared";
import * as fs from "fs";
import * as path from "path";

const PACK_ID = "CR-RESIDENCIAL-V1";

function loadJson<T>(filename: string): T {
  const packPath = path.join(process.cwd(), "../../data/ctk-packs/cr-residencial-v1", filename);
  const altPath = path.join(process.cwd(), "data/ctk-packs/cr-residencial-v1", filename);
  const finalPath = fs.existsSync(packPath) ? packPath : altPath;
  return JSON.parse(fs.readFileSync(finalPath, "utf-8")) as T;
}

export function loadPack(): CtkPack {
  const reglas: CtkRegla[] = [
    ...loadJson<CtkRegla[]>("notas_generales.json"),
    ...loadJson<CtkRegla[]>("notas_electricas_aresep.json"),
    ...loadJson<CtkRegla[]>("notas_mecanicas_sanitarias.json"),
    ...loadJson<CtkRegla[]>("notas_estructurales_techo.json"),
  ];
  const tablas = loadJson<CtkTablaFila[]>("tablas_referencia.json");
  const simbolos = loadJson<CtkSimbolo[]>("simbologia.json");
  const conflictos = loadJson<CtkPack["conflictos"]>("reglas_jerarquia_conflicto.json");

  return {
    id: PACK_ID,
    nombre: "Costa Rica Residencial V1",
    version: "1.0.0",
    reglas,
    tablas,
    simbolos,
    conflictos,
  };
}

export function parseNotasTexto(texto: string, disciplina: string, prefijo: string): CtkRegla[] {
  const reglas: CtkRegla[] = [];
  const lineas = texto.split(/\n+/);
  let numero = 0;

  for (const linea of lineas) {
    const match = linea.match(/^(\d+)\.\s*(.+)/);
    if (match) {
      numero = parseInt(match[1], 10);
      reglas.push({
        codigo: `${prefijo}-${String(numero).padStart(2, "0")}`,
        numero,
        categoria: "NORMATIVA",
        disciplina,
        textoOriginal: match[2].trim(),
      });
    }
  }
  return reglas;
}

export function classifyLaminaContent(filename: string, textSample: string): {
  tipo: string;
  disciplina: string;
} {
  const lower = (filename + " " + textSample).toLowerCase();
  if (lower.includes("notas electricas") || lower.includes("plano electrico")) {
    return { tipo: "NOTAS", disciplina: "ELECTRICO" };
  }
  if (lower.includes("notas generales")) {
    return { tipo: "NOTAS", disciplina: "GENERAL" };
  }
  if (lower.includes("simbologia") || lower.includes("simbología")) {
    return { tipo: "SIMBOLOGIA", disciplina: "SANITARIO_MECANICO" };
  }
  if (lower.includes("centro de carga") || lower.includes("tabla")) {
    return { tipo: "TABLA", disciplina: "ELECTRICO" };
  }
  if (lower.includes("estructur") || lower.includes("fundacion") || lower.includes("cercha")) {
    return { tipo: "ESTRUCTURA", disciplina: "ESTRUCTURA" };
  }
  if (lower.includes("sanitar") || lower.includes("mecanic")) {
    return { tipo: "SANITARIO_MECANICO", disciplina: "SANITARIO_MECANICO" };
  }
  if (lower.includes("ventana") || lower.includes("planta") || lower.includes("fachada")) {
    return { tipo: "ARQUITECTURA", disciplina: "ARQUITECTURA" };
  }
  return { tipo: "OTRO", disciplina: "GENERAL" };
}

export { PACK_ID };
