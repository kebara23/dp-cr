export * from "./partidas.js";
export * from "./citas.js";

export const DISCIPLINAS = [
  "arquitectura",
  "estructura",
  "electrico",
  "sanitario_mecanico",
  "general",
] as const;
export type Disciplina = (typeof DISCIPLINAS)[number];

export const CAPITULOS_PRESUPUESTO = [
  "01 Movimiento de tierras",
  "02 Cimentaciones y concreto",
  "03 Acero de refuerzo",
  "04 Paredes",
  "05 Cubiertas",
  "06 Puertas y ventanas",
  "07 Acabados",
  "08 Instalacion sanitaria",
  "09 Instalacion electrica",
] as const;
