// Catalogo de partidas MVP (6 clave). Se ensancha a ~30 en Fase 2.
// Cada partida declara la disciplina, unidad, capitulo de presupuesto y
// el "accionMotor" que el engine usa para calcular la cantidad.

export type AccionMotor =
  | "concreto_dosificado"
  | "acero_refuerzo"
  | "mamposteria"
  | "techo_zinc"
  | "ventanas_cuadro"
  | "pintura_perfiles";

export interface PartidaDef {
  codigo: string;
  descripcion: string;
  unidad: string;
  disciplina: "estructura" | "arquitectura" | "electrico" | "sanitario_mecanico" | "general";
  capitulo: string;
  accionMotor: AccionMotor;
}

export const CATALOGO_PARTIDAS: PartidaDef[] = [
  {
    codigo: "EST-CONC-210",
    descripcion: "Concreto dosificado f'c=210 kg/cm2 (fundaciones/vigas)",
    unidad: "m3",
    disciplina: "estructura",
    capitulo: "02 Cimentaciones y concreto",
    accionMotor: "concreto_dosificado",
  },
  {
    codigo: "EST-ACERO",
    descripcion: "Acero de refuerzo incl. traslapes",
    unidad: "kg",
    disciplina: "estructura",
    capitulo: "03 Acero de refuerzo",
    accionMotor: "acero_refuerzo",
  },
  {
    codigo: "ARQ-MAMP",
    descripcion: "Mamposteria/paredes prefabricadas incl. refuerzo",
    unidad: "m2",
    disciplina: "arquitectura",
    capitulo: "04 Paredes",
    accionMotor: "mamposteria",
  },
  {
    codigo: "ARQ-TECHO-ZINC",
    descripcion: "Cubierta lamina zinc rectangular #26 incl. traslape y desperdicio",
    unidad: "m2",
    disciplina: "arquitectura",
    capitulo: "05 Cubiertas",
    accionMotor: "techo_zinc",
  },
  {
    codigo: "ARQ-VENT",
    descripcion: "Ventanas segun cuadro (A-09)",
    unidad: "und",
    disciplina: "arquitectura",
    capitulo: "06 Puertas y ventanas",
    accionMotor: "ventanas_cuadro",
  },
  {
    codigo: "EST-PINT-PERF",
    descripcion: "Pintura anticorrosiva perfiles de techo (4 manos)",
    unidad: "m2",
    disciplina: "estructura",
    capitulo: "05 Cubiertas",
    accionMotor: "pintura_perfiles",
  },
];

export const partidaPorCodigo = (codigo: string): PartidaDef | undefined =>
  CATALOGO_PARTIDAS.find((p) => p.codigo === codigo);
