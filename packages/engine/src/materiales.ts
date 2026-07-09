import { calcularDosificacion } from "./dosificacion";

export interface LineaCantidadInput {
  partidaCodigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
}

export interface LineaMaterialInput {
  origenPartida: string | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  categoria: string | null;
}

const PROPORCION_DEFAULT = { cemento: 1, arena: 2, piedra: 3 };

/**
 * Explota partidas de obra a materiales comprables en ferretería.
 * - 02.01 concreto → cemento / arena / piedra
 * - 02.02 acero → se mantiene como kg (varilla genérica)
 * - resto → passthrough 1:1
 */
export function explotarMateriales(lineas: LineaCantidadInput[]): LineaMaterialInput[] {
  const out: LineaMaterialInput[] = [];

  for (const linea of lineas) {
    if (linea.cantidad <= 0) continue;

    if (linea.partidaCodigo === "02.01") {
      const dosif = calcularDosificacion(210, linea.cantidad, PROPORCION_DEFAULT);
      out.push({
        origenPartida: linea.partidaCodigo,
        descripcion: "Cemento Portland (saco 42.5 kg)",
        unidad: "saco",
        cantidad: dosif.sacosCemento,
        categoria: "concreto",
      });
      out.push({
        origenPartida: linea.partidaCodigo,
        descripcion: "Arena para concreto",
        unidad: "m³",
        cantidad: dosif.m3Arena,
        categoria: "concreto",
      });
      out.push({
        origenPartida: linea.partidaCodigo,
        descripcion: "Piedra para concreto",
        unidad: "m³",
        cantidad: dosif.m3Piedra,
        categoria: "concreto",
      });
      continue;
    }

    if (linea.partidaCodigo === "02.02") {
      out.push({
        origenPartida: linea.partidaCodigo,
        descripcion: "Varilla de refuerzo Grade 40",
        unidad: "kg",
        cantidad: Math.round(linea.cantidad * 100) / 100,
        categoria: "acero",
      });
      continue;
    }

    out.push({
      origenPartida: linea.partidaCodigo,
      descripcion: linea.descripcion,
      unidad: linea.unidad,
      cantidad: Math.round(linea.cantidad * 100) / 100,
      categoria: categoriaDesdePartida(linea.partidaCodigo),
    });
  }

  return out;
}

function categoriaDesdePartida(codigo: string): string {
  const cap = codigo.split(".")[0];
  switch (cap) {
    case "01":
      return "tierras";
    case "02":
      return "estructura";
    case "03":
      return "mamposteria";
    case "04":
      return "acabados";
    case "05":
      return "cubiertas";
    case "06":
      return "carpinteria";
    case "07":
      return "sanitario";
    case "08":
      return "mecanico";
    case "09":
      return "electrico";
    default:
      return "general";
  }
}
