// Tipos del pack CTK CR-RESIDENCIAL-V1 y formato interno.

export interface PackMetadata {
  id: string;
  nombre: string;
  descripcion: string;
  region: string;
  version: string;
  archivos: string[];
}

export interface DocumentoCtk {
  documento: {
    titulo: string;
    disciplina: string;
    fuente: string;
  };
  reglas?: ReglaCtk[];
  tablas?: FilaTablaCtk[];
  simbolos?: SimboloCtk[];
  jerarquia?: Record<string, string[]>;
}

export interface ReglaCtk {
  codigo: string;
  textoOriginal: string;
  categoria: string;
  disciplina: string;
  parametrosJson?: Record<string, unknown>;
  partidasAfectadas?: string[];
  accionMotor?: string;
  prioridad?: number;
  requiereValidacion?: boolean;
}

export interface FilaTablaCtk {
  tabla: string;
  clave: string;
  valores: Record<string, unknown>;
}

export interface SimboloCtk {
  codigo: string;
  descripcion: string;
  disciplina: string;
  metadata?: Record<string, unknown>;
}

export type DisciplinaCtk =
  | "arquitectura"
  | "estructura"
  | "electrico"
  | "sanitario_mecanico"
  | "general";
