import { procesarPregunta } from "./index";

const PREGUNTAS = [
  { q: "¿Dosificación concreto 210 para 10 m³?", expect: ["sacos", "cemento"], minConfianza: 0.8 },
  { q: "¿Traslape varilla #4 para 10 metros?", expect: ["traslap", "kg"], minConfianza: 0.8 },
  { q: "¿Recubrimiento en zapatas?", expect: ["conflicto", "mm"], minConfianza: 0.8 },
  { q: "¿Altura tomas en baño?", expect: ["1.10", "NE-19"], minConfianza: 0.8 },
  { q: "¿Resistencia de tierra máxima?", expect: ["5", "ohm"], minConfianza: 0.8 },
  { q: "¿Colores de conductores?", expect: ["rojo", "NE-13"], minConfianza: 0.8 },
  { q: "¿Carga total eléctrica del proyecto?", expect: ["23050", "W"], minConfianza: 0.8 },
  { q: "¿Área ventana V-1?", expect: ["1.50", "1.40"], minConfianza: 0.8 },
  { q: "¿Ventana V-3 dimensiones?", expect: ["1.00", "0.40"], minConfianza: 0.8 },
  { q: "¿Cuánto zinc para techo?", expect: ["135", "desperdicio"], minConfianza: 0.8 },
  { q: "¿Capacidad fosa séptica?", expect: ["1100"], minConfianza: 0.8 },
  { q: "¿Pendiente aguas negras?", expect: ["1.5", "100"], minConfianza: 0.8 },
  { q: "¿Pintura perfiles techo cuántas manos?", expect: ["4", "manos"], minConfianza: 0.8 },
  { q: "¿Refuerzo mampostería?", expect: ["#3", "40"], minConfianza: 0.8 },
  { q: "¿Conflicto curado concreto?", expect: ["días", "28"], minConfianza: 0.8 },
  { q: "¿Perfil cercha estructural?", expect: ["A-570", "E6011"], minConfianza: 0.8 },
  { q: "¿Circuito cocina eléctrica?", expect: ["4000", "40"], minConfianza: 0.5 },
  { q: "¿Traslape láminas zinc?", expect: ["15"], minConfianza: 0.8 },
  { q: "¿Dosificación repello 175?", expect: ["175"], minConfianza: 0.5 },
  { q: "¿Normativa eléctrica aplicable?", expect: ["ARESEP"], minConfianza: 0.7 },
];

let passed = 0;
let failed = 0;

console.log("=== Tests de aceptación Agente IA ===\n");

for (const [i, test] of PREGUNTAS.entries()) {
  const result = procesarPregunta(test.q);
  const respLower = (result.respuesta + JSON.stringify(result.fuentes)).toLowerCase();
  const ok =
    result.confianza >= test.minConfianza &&
    result.fuentes.length >= 1 &&
    test.expect.every((e) => respLower.includes(e.toLowerCase()));

  if (ok) {
    passed++;
    console.log(`✓ ${i + 1}. ${test.q.slice(0, 50)}...`);
  } else {
    failed++;
    console.log(`✗ ${i + 1}. ${test.q}`);
    console.log(`  Respuesta: ${result.respuesta.slice(0, 100)}...`);
    console.log(`  Confianza: ${result.confianza}, Fuentes: ${result.fuentes.length}`);
  }
}

console.log(`\n=== Resultado: ${passed}/${PREGUNTAS.length} passed (mínimo MVP: 16/20) ===`);
process.exit(passed >= 16 ? 0 : 1);
