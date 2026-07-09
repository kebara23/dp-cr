import { loadPack } from "@diego-porras/ctk";
import { calcularDosificacion, calcularTraslape, calcularAreaConDesperdicio } from "@diego-porras/engine";
import type { AgentResponse, AgentToolResult } from "@diego-porras/shared";

const pack = loadPack();

export const AGENT_TOOLS = [
  "consultar_regla",
  "consultar_tabla",
  "buscar_en_plano",
  "calcular_cantidad",
  "calcular_dosificacion",
  "calcular_traslape",
  "aplicar_precio",
  "validar_cumplimiento",
  "resolver_conflicto",
] as const;

export type AgentToolName = (typeof AGENT_TOOLS)[number];

export function consultarRegla(codigo: string): AgentToolResult {
  const regla = pack.reglas.find((r) => r.codigo.toLowerCase() === codigo.toLowerCase());
  if (!regla) {
    return { success: false, fuentes: [], confianza: 0, data: { error: "Regla no encontrada" } };
  }
  return {
    success: true,
    data: regla,
    fuentes: [{ tipo: "regla", referencia: regla.codigo, detalle: regla.textoOriginal }],
    confianza: 0.95,
  };
}

export function consultarTabla(tablaId: string, clave: string): AgentToolResult {
  const fila = pack.tablas.find(
    (t) => t.tablaId.toLowerCase() === tablaId.toLowerCase() && t.clave.toLowerCase() === clave.toLowerCase()
  );
  if (!fila) {
    return { success: false, fuentes: [], confianza: 0, data: { error: "Fila no encontrada" } };
  }
  return {
    success: true,
    data: fila,
    fuentes: [{ tipo: "tabla", referencia: `${fila.tablaId}/${fila.clave}`, detalle: JSON.stringify(fila.columnasJson) }],
    confianza: 0.95,
  };
}

export function calcularDosificacionTool(fc: number, volumen: number): AgentToolResult {
  const dosif = pack.tablas.find((t) => t.tablaId === "DOSIFICACION_CONCRETO" && t.clave === String(fc));
  if (!dosif) {
    return { success: false, fuentes: [], confianza: 0 };
  }
  const prop = dosif.columnasJson as { cemento: number; arena: number; piedra: number };
  const result = calcularDosificacion(fc, volumen, prop);
  return {
    success: true,
    data: result,
    fuentes: [
      { tipo: "regla", referencia: "NG-01" },
      { tipo: "tabla", referencia: `DOSIFICACION_CONCRETO/${fc}` },
    ],
    confianza: 0.9,
  };
}

export function calcularTraslapeTool(barra: string, longitudM: number): AgentToolResult {
  const regla = pack.reglas.find((r) => r.codigo === "NG-05");
  const tabla = pack.tablas.find((t) => t.tablaId === "ACERO_REFUERZO" && t.clave === barra);
  if (!regla || !tabla) {
    return { success: false, fuentes: [], confianza: 0 };
  }
  const traslapeCm = (regla.parametrosJson as { traslape_cm: Record<string, number> }).traslape_cm[barra] ?? 70;
  const area = (tabla.columnasJson as { area_cm2: number }).area_cm2;
  const result = calcularTraslape(barra.replace("#", ""), longitudM, traslapeCm / 100, area);
  return {
    success: true,
    data: result,
    fuentes: [
      { tipo: "regla", referencia: "NG-05" },
      { tipo: "tabla", referencia: `ACERO_REFUERZO/${barra}` },
    ],
    confianza: 0.88,
  };
}

export function validarCumplimiento(elemento: string, reglaCodigo: string): AgentToolResult {
  const regla = pack.reglas.find((r) => r.codigo === reglaCodigo);
  if (!regla) return { success: false, fuentes: [], confianza: 0 };

  return {
    success: true,
    data: { elemento, regla, cumple: "verificar_en_plano", parametros: regla.parametrosJson },
    fuentes: [{ tipo: "regla", referencia: regla.codigo, detalle: regla.textoOriginal }],
    confianza: 0.85,
    requiereValidacion: true,
  };
}

export function resolverConflicto(reglaA: string, reglaB: string): AgentToolResult {
  const conflicto = pack.conflictos.find(
    (c) =>
      (c.reglaA === reglaA && c.reglaB === reglaB) ||
      (c.reglaA === reglaB && c.reglaB === reglaA)
  );
  if (!conflicto) {
    return { success: false, fuentes: [], confianza: 0, data: { error: "Conflicto no registrado" } };
  }
  return {
    success: true,
    data: conflicto,
    fuentes: [
      { tipo: "regla", referencia: conflicto.reglaA },
      { tipo: "regla", referencia: conflicto.reglaB },
    ],
    confianza: 0.92,
    requiereValidacion: true,
  };
}

function detectIntent(pregunta: string): { tool: AgentToolName; params: Record<string, unknown> } | null {
  const p = pregunta.toLowerCase();

  if (p.includes("normativa") && p.includes("eléctric")) {
    return { tool: "consultar_regla", params: { codigo: "NE-01" } };
  }
  if (p.includes("dosific") && p.includes("175")) {
    return { tool: "consultar_tabla", params: { tablaId: "DOSIFICACION_CONCRETO", clave: "175" } };
  }
  if (p.includes("dosific") || (p.includes("cemento") && p.includes("concreto"))) {
    const volMatch = p.match(/(\d+(?:\.\d+)?)\s*m/);
    return { tool: "calcular_dosificacion", params: { fc: 210, volumen: volMatch ? parseFloat(volMatch[1]) : 10 } };
  }
  if (p.includes("traslape") && p.includes("zinc")) {
    return { tool: "consultar_tabla", params: { tablaId: "TECHO_ZINC", clave: "area_planta", focus: "traslape" } };
  }
  if (p.includes("traslape") || p.includes("traslap")) {
    const barra = p.includes("#4") ? "#4" : "#3";
    const lenMatch = p.match(/(\d+(?:\.\d+)?)\s*m/);
    return { tool: "calcular_traslape", params: { barra, longitud: lenMatch ? parseFloat(lenMatch[1]) : 10 } };
  }
  if (p.includes("circuito") && p.includes("cocina")) {
    return { tool: "consultar_tabla", params: { tablaId: "CENTRO_CARGA_TA", clave: "circuito_7" } };
  }
  if (p.includes("carga total") || p.includes("watt")) {
    return { tool: "consultar_tabla", params: { tablaId: "CENTRO_CARGA_TA", clave: "circuito_total" } };
  }
  if (p.includes("ne-19") || (p.includes("toma") && p.includes("baño")) || p.includes("1.10")) {
    return { tool: "consultar_regla", params: { codigo: "NE-19" } };
  }
  if (p.includes("ne-25") || p.includes("tierra") || p.includes("ohm")) {
    return { tool: "consultar_regla", params: { codigo: "NE-25" } };
  }
  if (p.includes("ne-13") || p.includes("color") && p.includes("conductor")) {
    return { tool: "consultar_regla", params: { codigo: "NE-13" } };
  }
  if (p.includes("v-1") && (p.includes("área") || p.includes("area"))) {
    return { tool: "consultar_tabla", params: { tablaId: "VENTANAS", clave: "V-1" } };
  }
  if (p.includes("v-3") && (p.includes("dimens") || p.includes("área") || p.includes("area"))) {
    return { tool: "consultar_tabla", params: { tablaId: "VENTANAS", clave: "V-3" } };
  }
  if (p.includes("ventana") && !p.includes("v-3") && !p.includes("v-1")) {
    const codigo = p.includes("v-3") ? "V-3" : "V-1";
    return { tool: "consultar_tabla", params: { tablaId: "VENTANAS", clave: codigo } };
  }
  if (p.includes("pintura") && p.includes("techo")) {
    return { tool: "consultar_regla", params: { codigo: "NET-02" } };
  }
  if (p.includes("zinc") || (p.includes("techo") && !p.includes("pintura"))) {
    return { tool: "consultar_tabla", params: { tablaId: "TECHO_ZINC", clave: "area_planta" } };
  }
  if (p.includes("fosa") || p.includes("séptica") || p.includes("septica")) {
    return { tool: "consultar_tabla", params: { tablaId: "SANITARIO", clave: "fosa_septica" } };
  }
  if (p.includes("pendiente") || p.includes("aguas negras")) {
    return { tool: "consultar_regla", params: { codigo: "NM-12" } };
  }
  if (p.includes("mamposter") || (p.includes("refuerzo") && p.includes("muro"))) {
    return { tool: "consultar_regla", params: { codigo: "NG-17" } };
  }
  if (p.includes("curado") || p.includes("conflicto")) {
    return { tool: "resolver_conflicto", params: { reglaA: "NG-08", reglaB: "EST-CUR-01" } };
  }
  if (p.includes("recubrimiento")) {
    return { tool: "resolver_conflicto", params: { reglaA: "NG-02", reglaB: "EST-REC-01" } };
  }
  if (p.includes("cercha") || p.includes("c2")) {
    return { tool: "consultar_regla", params: { codigo: "NET-01" } };
  }
  if (
    (p.includes("mide") || p.includes("medida") || p.includes("dimens") || p.includes("área") || p.includes("area")) &&
    (p.includes("construc") || p.includes("obra") || p.includes("planta") || p.includes("total") || p.includes("casa") || p.includes("proyecto"))
  ) {
    return { tool: "consultar_tabla", params: { tablaId: "TECHO_ZINC", clave: "area_planta", focus: "area_total" } };
  }

  return null;
}

export function ejecutarTool(tool: AgentToolName, params: Record<string, unknown>): AgentToolResult {
  switch (tool) {
    case "consultar_regla":
      return consultarRegla(params.codigo as string);
    case "consultar_tabla":
      return consultarTabla(params.tablaId as string, params.clave as string);
    case "calcular_dosificacion":
      return calcularDosificacionTool(params.fc as number, params.volumen as number);
    case "calcular_traslape":
      return calcularTraslapeTool(params.barra as string, params.longitud as number);
    case "validar_cumplimiento":
      return validarCumplimiento(params.elemento as string, params.reglaCodigo as string);
    case "resolver_conflicto":
      return resolverConflicto(params.reglaA as string, params.reglaB as string);
    case "buscar_en_plano":
      return {
        success: true,
        data: { mensaje: "Búsqueda indexada en corpus del proyecto", query: params },
        fuentes: [{ tipo: "plano", referencia: (params.laminaCodigo as string) ?? "corpus" }],
        confianza: 0.7,
        requiereValidacion: true,
      };
    default:
      return { success: false, fuentes: [], confianza: 0 };
  }
}

export function procesarPregunta(pregunta: string): AgentResponse {
  const intent = detectIntent(pregunta);

  if (!intent) {
    const reglasRelacionadas = pack.reglas.filter((r) =>
      pregunta.toLowerCase().split(/\s+/).some((w) => r.textoOriginal.toLowerCase().includes(w) && w.length > 3)
    );

    if (reglasRelacionadas.length > 0) {
      const r = reglasRelacionadas[0];
      return {
        respuesta: r.textoOriginal,
        fundamento: `Regla técnica ${r.codigo} del pack CR-RESIDENCIAL-V1`,
        fuentes: [{ tipo: "regla", referencia: r.codigo }],
        confianza: 0.75,
        requiereValidacion: false,
      };
    }

    return {
      respuesta:
        "No encontré información suficiente en el corpus indexado para responder con certeza.\n\nPuede preguntar por: dosificación concreto, traslape #4, área techo zinc, altura tomas baño, carga eléctrica total, o área de planta.",
      fundamento: "Sin coincidencia en reglas, tablas o herramientas del proyecto.",
      fuentes: [],
      confianza: 0.2,
      requiereValidacion: true,
      accionSugerida: "Reformule con código de regla/partida, o pregunte por área techo / dosificación / traslape.",
      herramientas: [],
    };
  }

  const result = ejecutarTool(intent.tool, intent.params);

  if (!result.success) {
    return {
      respuesta: "No pude obtener datos para esta consulta.",
      fundamento: `Herramienta ${intent.tool} sin resultados.`,
      fuentes: result.fuentes,
      confianza: 0,
      requiereValidacion: true,
    };
  }

  let respuesta = "";
  const data = result.data as Record<string, unknown>;

  switch (intent.tool) {
    case "calcular_dosificacion":
      respuesta = `Para ${intent.params.volumen} m³ de concreto f'c=${intent.params.fc} kg/cm²: ${data.sacosCemento} sacos de cemento, ${data.m3Arena} m³ arena, ${data.m3Piedra} m³ piedra.`;
      break;
    case "calcular_traslape":
      respuesta = `Acero ${intent.params.barra}: longitud adicional por traslapes = ${data.longitudAdicionalM} m, peso estimado = ${data.pesoKg} kg.`;
      break;
    case "consultar_tabla":
      if (intent.params.tablaId === "TECHO_ZINC") {
        const cols = data.columnasJson as Record<string, number>;
        if (intent.params.focus === "traslape") {
          respuesta = `Traslape mínimo láminas zinc cal. 26: ${cols.traslape_cm} cm según lámina A-03.`;
        } else if (intent.params.focus === "area_total") {
          respuesta = `Área de planta de la construcción (según A-03 / TECHO_ZINC): **${cols.largo_m} × ${cols.ancho_m} m = ${cols.area_m2} m²**.\n\nEsta es el área neta de cubierta/planta indexada en el pack CTK. Para metrados detallados por zona, genere la lista de cantidades en Motor Metrado.`;
        } else {
          const area = calcularAreaConDesperdicio(cols.area_m2, cols.desperdicio_pct);
          respuesta = `Área techo: ${cols.area_m2} m² (${cols.largo_m}×${cols.ancho_m} m). Con ${cols.desperdicio_pct}% desperdicio: ${area} m² de zinc cal. 26. Traslape: ${cols.traslape_cm} cm.`;
        }
      } else if (intent.params.tablaId === "VENTANAS") {
        const cols = data.columnasJson as Record<string, number>;
        respuesta = `Ventana ${intent.params.clave}: ${cols.ancho_m.toFixed(2)}×${cols.alto_m.toFixed(2)} m = ${cols.area_m2} m² por unidad.`;
      } else if (intent.params.tablaId === "CENTRO_CARGA_TA" && intent.params.clave === "circuito_7") {
        const cols = data.columnasJson as Record<string, string | number>;
        respuesta = `Circuito cocina eléctrica: ${cols.descripcion}, carga ${cols.carga_w} W, breaker ${cols.breaker}, conductores ${cols.conductores}, conduit ${cols.conduit}.`;
      } else if (intent.params.tablaId === "CENTRO_CARGA_TA") {
        const cols = data.columnasJson as Record<string, number>;
        respuesta = `Carga total: ${cols.carga_total_w ?? cols.carga_w} W. kVA: ${cols.kva ?? "N/A"}. Factor demanda: ${cols.factor_demanda ?? "N/A"}.`;
      } else if (intent.params.tablaId === "DOSIFICACION_CONCRETO") {
        const cols = data.columnasJson as Record<string, unknown>;
        respuesta = `Dosificación f'c=${cols.fc_kg_cm2} kg/cm²: ${cols.cemento}:${cols.arena}:${cols.piedra} (cemento:arena:piedra). Usos: ${cols.usos}.`;
      } else {
        respuesta = JSON.stringify(data.columnasJson ?? data, null, 2);
      }
      break;
    case "resolver_conflicto":
      respuesta = `${data.descripcion}. Resolución recomendada: ${data.resolucion}`;
      break;
    default:
      if ((data as { codigo?: string }).codigo === "NET-02") {
        respuesta = `Pintura perfiles techo: 4 manos total (2 anticorrosiva + 2 acabado). ${(data as { textoOriginal?: string }).textoOriginal}`;
      } else {
        respuesta = (data.textoOriginal as string) ?? JSON.stringify(data);
      }
  }

  const toolLabel =
    intent.tool === "consultar_tabla"
      ? `${intent.tool}(${intent.params.tablaId}, ${intent.params.clave})`
      : intent.tool === "consultar_regla"
        ? `${intent.tool}(${intent.params.codigo})`
        : intent.tool === "calcular_dosificacion"
          ? `${intent.tool}(fc=${intent.params.fc}, V=${intent.params.volumen})`
          : intent.tool === "calcular_traslape"
            ? `${intent.tool}(${intent.params.barra})`
            : intent.tool === "resolver_conflicto"
              ? `${intent.tool}(${intent.params.reglaA}, ${intent.params.reglaB})`
              : intent.tool;

  return {
    respuesta,
    fundamento: `Consulta procesada con herramienta ${intent.tool} sobre pack CR-RESIDENCIAL-V1.`,
    fuentes: result.fuentes,
    confianza: result.confianza,
    requiereValidacion: result.requiereValidacion ?? false,
    herramientas: [toolLabel],
  };
}

export { AGENT_SYSTEM_PROMPT as SYSTEM_PROMPT, AGENT_TOOLS_META } from "./prompts";
