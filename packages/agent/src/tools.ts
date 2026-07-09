// Definiciones de tools para Claude function calling.
// MVP: 6 tools clave. Implementación completa en Fase 3.

export const AGENT_TOOLS = [
  {
    name: "consultar_regla",
    description:
      "Consultar regla técnica por código (NG-05, NE-19, NM-12, etc). Retorna texto, categoría, parámetros y partidas afectadas.",
    input_schema: {
      type: "object",
      properties: {
        codigo: {
          type: "string",
          description: "Código de la regla (ej: NG-05, NE-19)",
        },
      },
      required: ["codigo"],
    },
  },
  {
    name: "consultar_tabla",
    description:
      "Consultar fila de tabla de referencia (dosificaciones, acero, centro de carga, etc).",
    input_schema: {
      type: "object",
      properties: {
        tabla: {
          type: "string",
          description: "Nombre de tabla (acero, dosificaciones, etc)",
        },
        clave: {
          type: "string",
          description: "Clave en la tabla (#4, 210, circuito_7)",
        },
      },
      required: ["tabla", "clave"],
    },
  },
  {
    name: "buscar_en_plano",
    description:
      "Buscar fragmentos de plano indexados por RAG (elementos, cotas, dimensiones).",
    input_schema: {
      type: "object",
      properties: {
        disciplina: {
          type: "string",
          enum: ["arquitectura", "estructura", "electrico", "sanitario_mecanico"],
        },
        elemento: {
          type: "string",
          description: "Qué buscar (área, ventanas, techo, etc)",
        },
      },
      required: ["disciplina", "elemento"],
    },
  },
  {
    name: "calcular_cantidad",
    description: "Calcular cantidad de una partida usando el motor metrado.",
    input_schema: {
      type: "object",
      properties: {
        partida: {
          type: "string",
          description: "Código partida (EST-CONC-210, ARQ-TECHO-ZINC)",
        },
        parametros: {
          type: "object",
          description: "Parámetros específicos (volumen_m3, area_m2, etc)",
        },
      },
      required: ["partida"],
    },
  },
  {
    name: "aplicar_precio",
    description: "Aplicar precio unitario de fuente vigente a una partida.",
    input_schema: {
      type: "object",
      properties: {
        partida: {
          type: "string",
          description: "Código partida",
        },
        fuente_precio_id: {
          type: "string",
          description: "ID de fuente de precio vigente",
        },
      },
      required: ["partida", "fuente_precio_id"],
    },
  },
  {
    name: "validar_cumplimiento",
    description:
      "Validar si un elemento cumple con una regla técnica. Retorna conformidad y detalle.",
    input_schema: {
      type: "object",
      properties: {
        elemento: {
          type: "string",
          description: "Elemento a validar (V-3, E-1, etc)",
        },
        regla_codigo: {
          type: "string",
          description: "Código regla a validar",
        },
      },
      required: ["elemento", "regla_codigo"],
    },
  },
] as const;

export type AgentToolName = (typeof AGENT_TOOLS)[number]["name"];
