/**
 * Matching fuzzy de descripciones de materiales entre lista interna y cotizaciones.
 * Sin dependencias de IA — normalización + similitud de tokens / Levenshtein.
 */

export function normalizarTexto(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s#./-]/g, " ")
    .replace(/\b(und|unid|unidad|m2|m3|ml|kg|saco|sacos|varilla|varillas)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(normalizarTexto(s).split(" ").filter((t) => t.length > 1));
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function similitudDescripcion(a: string, b: string): number {
  const na = normalizarTexto(a);
  const nb = normalizarTexto(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;

  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  const jaccard = union === 0 ? 0 : inter / union;

  const maxLen = Math.max(na.length, nb.length);
  const lev = 1 - levenshtein(na, nb) / maxLen;

  return Math.round((jaccard * 0.65 + lev * 0.35) * 1000) / 1000;
}

export interface MaterialMatchTarget {
  id: string;
  descripcion: string;
}

export interface MatchResult {
  lineaMaterialId: string | null;
  confianza: number;
}

export function matchMaterial(
  descripcionCotizacion: string,
  materiales: MaterialMatchTarget[],
  umbral = 0.45
): MatchResult {
  let best: MatchResult = { lineaMaterialId: null, confianza: 0 };
  for (const m of materiales) {
    const conf = similitudDescripcion(descripcionCotizacion, m.descripcion);
    if (conf > best.confianza) {
      best = { lineaMaterialId: m.id, confianza: conf };
    }
  }
  if (best.confianza < umbral) {
    return { lineaMaterialId: null, confianza: best.confianza };
  }
  return best;
}
