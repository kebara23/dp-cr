import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const proyectoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  ubicacion: z.string().optional(),
  provincia: z.string().optional(),
  canton: z.string().optional(),
  distrito: z.string().optional(),
  tipoObra: z.enum(["RESIDENCIAL", "COMERCIAL", "INDUSTRIAL", "INFRAESTRUCTURA"]).default("RESIDENCIAL"),
  moneda: z.enum(["CRC", "USD"]).default("CRC"),
  propietario: z.string().optional(),
  cedulaProp: z.string().optional(),
  planoCatastral: z.string().optional(),
});

export const laminaSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  disciplina: z.enum([
    "ARQUITECTURA", "ESTRUCTURA", "ELECTRICO", "SANITARIO_MECANICO",
    "GENERAL", "NOTAS", "TABLA", "SIMBOLOGIA", "DETALLE"
  ]),
  tipo: z.enum([
    "ARQUITECTURA", "ESTRUCTURA", "ELECTRICO", "SANITARIO_MECANICO",
    "NOTAS", "TABLA", "SIMBOLOGIA", "DETALLE", "OTRO"
  ]),
  escala: z.string().optional(),
  revision: z.string().default("A"),
});

export const fuentePrecioSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.string().default("proveedor"),
  moneda: z.enum(["CRC", "USD"]).default("CRC"),
  vigenciaDesde: z.string(),
  vigenciaHasta: z.string().optional(),
});

export const publicacionSchema = z.object({
  nivelDetalle: z.enum(["RESUMEN", "INTERMEDIO", "DETALLADO"]).default("RESUMEN"),
  mensajeAdmin: z.string().optional(),
  elementosVisibles: z.object({
    resumen: z.boolean().default(true),
    capitulos: z.boolean().default(true),
    cantidades: z.boolean().default(false),
    planos: z.boolean().default(false),
    cotizacion: z.boolean().default(true),
  }),
});

export const chatMessageSchema = z.object({
  mensaje: z.string().min(1),
  disciplina: z.string().optional(),
  laminaCodigo: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProyectoInput = z.infer<typeof proyectoSchema>;
export type LaminaInput = z.infer<typeof laminaSchema>;
export type FuentePrecioInput = z.infer<typeof fuentePrecioSchema>;
export type PublicacionInput = z.infer<typeof publicacionSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const CAPITULOS = [
  { codigo: "01", nombre: "Movimiento de tierras" },
  { codigo: "02", nombre: "Cimentación y estructura" },
  { codigo: "03", nombre: "Mampostería" },
  { codigo: "04", nombre: "Acabados" },
  { codigo: "05", nombre: "Cubiertas" },
  { codigo: "06", nombre: "Puertas y ventanas" },
  { codigo: "07", nombre: "Instalación sanitaria" },
  { codigo: "08", nombre: "Instalación mecánica" },
  { codigo: "09", nombre: "Instalación eléctrica" },
] as const;

export const PARTIDAS_MVP = [
  { codigo: "01.01", capitulo: "01", descripcion: "Excavación manual", unidad: "m³" },
  { codigo: "02.01", capitulo: "02", descripcion: "Concreto f'c=210 kg/cm² en zapatas", unidad: "m³" },
  { codigo: "02.02", capitulo: "02", descripcion: "Acero de refuerzo Grade 40", unidad: "kg" },
  { codigo: "02.03", capitulo: "02", descripcion: "Encofrado y desencofrado", unidad: "m²" },
  { codigo: "03.01", capitulo: "03", descripcion: "Muro bloque 15cm", unidad: "m²" },
  { codigo: "03.02", capitulo: "03", descripcion: "Repello 1:5", unidad: "m²" },
  { codigo: "04.01", capitulo: "04", descripcion: "Cerámica piso", unidad: "m²" },
  { codigo: "04.02", capitulo: "04", descripcion: "Pintura latex paredes", unidad: "m²" },
  { codigo: "04.03", capitulo: "04", descripcion: "Cielo PVC", unidad: "m²" },
  { codigo: "05.01", capitulo: "05", descripcion: "Lámina zinc cal. 26", unidad: "m²" },
  { codigo: "05.02", capitulo: "05", descripcion: "Canoa HG #26", unidad: "ml" },
  { codigo: "05.03", capitulo: "05", descripcion: "Bajante PVC Ø75mm", unidad: "ml" },
  { codigo: "05.04", capitulo: "05", descripcion: "Cercha HG 75x75x1.5", unidad: "und" },
  { codigo: "05.05", capitulo: "05", descripcion: "Pintura anticorrosiva perfiles", unidad: "m²" },
  { codigo: "06.01", capitulo: "06", descripcion: "Puerta madera", unidad: "und" },
  { codigo: "06.02", capitulo: "06", descripcion: "Ventana aluminio/vidrio", unidad: "m²" },
  { codigo: "07.01", capitulo: "07", descripcion: "Tubería PVC sanitaria Ø100mm", unidad: "ml" },
  { codigo: "07.02", capitulo: "07", descripcion: "Tubería PVC sanitaria Ø50mm", unidad: "ml" },
  { codigo: "07.03", capitulo: "07", descripcion: "Fosa séptica 1100L", unidad: "und" },
  { codigo: "07.04", capitulo: "07", descripcion: "Inodoro una pieza", unidad: "und" },
  { codigo: "07.05", capitulo: "07", descripcion: "Lavamanos con accesorios", unidad: "und" },
  { codigo: "08.01", capitulo: "08", descripcion: "Tubería PVC agua presión", unidad: "ml" },
  { codigo: "09.01", capitulo: "09", descripcion: "Centro de carga 18 circuitos", unidad: "und" },
  { codigo: "09.02", capitulo: "09", descripcion: "Cable THHN #12", unidad: "ml" },
  { codigo: "09.03", capitulo: "09", descripcion: "Conduit PVC 1/2\"", unidad: "ml" },
  { codigo: "09.04", capitulo: "09", descripcion: "Tomacorriente duplex", unidad: "und" },
  { codigo: "09.05", capitulo: "09", descripcion: "Interruptor sencillo", unidad: "und" },
  { codigo: "09.06", capitulo: "09", descripcion: "Luminaria empotrada", unidad: "und" },
  { codigo: "09.07", capitulo: "09", descripcion: "Varilla de tierra con conector", unidad: "und" },
  { codigo: "09.08", capitulo: "09", descripcion: "Breaker GFCI 20A", unidad: "und" },
] as const;

export * from "./types";
