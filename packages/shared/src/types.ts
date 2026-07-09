export interface CtkRegla {
  codigo: string;
  numero?: number;
  categoria: string;
  disciplina: string;
  textoOriginal: string;
  parametrosJson?: Record<string, unknown>;
  partidasAfectadas?: string[];
  accionMotor?: string;
  prioridad?: number;
  requiereValidacion?: boolean;
}

export interface CtkTablaFila {
  tablaId: string;
  clave: string;
  columnasJson: Record<string, unknown>;
  unidadPrecio?: string;
  partidaCodigo?: string;
}

export interface CtkSimbolo {
  codigo: string;
  nombre: string;
  descripcion?: string;
  equivalenteMaterial?: string;
  reglasAsociadas?: string[];
  alturaInstalacionM?: number;
}

export interface CtkPack {
  id: string;
  nombre: string;
  version: string;
  reglas: CtkRegla[];
  tablas: CtkTablaFila[];
  simbolos: CtkSimbolo[];
  conflictos: Array<{
    reglaA: string;
    reglaB: string;
    descripcion: string;
    resolucion: string;
  }>;
}

export interface AgentToolResult {
  success: boolean;
  data?: unknown;
  fuentes: Array<{ tipo: string; referencia: string; detalle?: string }>;
  confianza: number;
  requiereValidacion?: boolean;
}

export interface AgentResponse {
  respuesta: string;
  fundamento: string;
  fuentes: Array<{ tipo: string; referencia: string; detalle?: string }>;
  confianza: number;
  requiereValidacion: boolean;
  accionSugerida?: string;
  herramientas?: string[];
}

export interface ResultadoTrazable<T> {
  valor: T;
  formula: string;
  citas: Array<{ tipo: string; codigo: string; detalle?: string }>;
  requiereValidacion: boolean;
  confianza: number;
}

export type ModuloApp =
  | "LAMINAS"
  | "CTK"
  | "MOTOR_METRADO"
  | "PRESUPUESTO"
  | "AGENTE_IA"
  | "PORTAL_CLIENTE"
  | "AUDITORIA"
  | "MANAGEMENT";

export interface MetradoInput {
  partidaCodigo: string;
  parametros: Record<string, number>;
  coefDesperdicio?: number;
}

export interface MetradoResult {
  partidaCodigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  formulaAplicada: string;
  reglasCtkIds: string[];
}
