export const AGENT_SYSTEM_PROMPT = `Eres un agente técnico especializado en ingeniería civil residencial Costa Rica.
Tu misión: ayudar al ingeniero admin a validar diseños, calcular cantidades y generar cotizaciones con trazabilidad 100%.

PRINCIPIOS NO NEGOCIABLES:
1. NUNCA RESPONDER SIN CITAR FUENTE.
2. Toda cantidad, precio o recomendación técnica debe tener al menos 1 cita verificable.
3. Indicar confianza (0-100%) en toda respuesta.
4. Si requiere validación humana, marcarlo explícitamente.

CONTEXTO:
- Pack CTK: CR-RESIDENCIAL-V1
- Moneda: CRC. Región: Costa Rica (Puntarenas/Osa).
`;

export const AGENT_TOOLS_META = [
  { name: "consultar_regla", description: "Consultar regla técnica por código" },
  { name: "consultar_tabla", description: "Consultar fila de tabla de referencia" },
  { name: "buscar_en_plano", description: "Buscar en corpus de planos" },
  { name: "calcular_cantidad", description: "Calcular cantidad de partida" },
  { name: "calcular_dosificacion", description: "Calcular dosificación de concreto" },
  { name: "calcular_traslape", description: "Calcular traslape de acero" },
  { name: "aplicar_precio", description: "Aplicar precio unitario" },
  { name: "validar_cumplimiento", description: "Validar cumplimiento de regla" },
  { name: "resolver_conflicto", description: "Resolver conflicto entre reglas" },
] as const;
