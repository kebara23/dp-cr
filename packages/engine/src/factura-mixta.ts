export interface MaterialParaMixta {
  id: string;
  cantidad: number;
}

export interface CotizacionParaMixta {
  id: string;
  lineaMaterialId: string | null;
  ferreteriaId: string;
  precioUnitario: number;
  cantidad?: number | null;
}

export interface LineaFacturaMixtaResult {
  lineaMaterialId: string;
  ferreteriaId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface FacturaMixtaResult {
  lineas: LineaFacturaMixtaResult[];
  totalOptimizado: number;
  totalMejorGlobal: number;
  ahorroEstimado: number;
}

/**
 * Elige el precio unitario más bajo por material (factura mixta)
 * y calcula el ahorro vs. comprar todo en la ferretería más barata globalmente.
 */
export function calcularFacturaMixta(
  lineasMaterial: MaterialParaMixta[],
  cotizaciones: CotizacionParaMixta[]
): FacturaMixtaResult {
  const lineas: LineaFacturaMixtaResult[] = [];
  const ferreteriaIds = new Set(cotizaciones.map((c) => c.ferreteriaId));

  for (const material of lineasMaterial) {
    const matches = cotizaciones.filter((c) => c.lineaMaterialId === material.id);
    if (matches.length === 0) continue;

    let best = matches[0];
    for (const m of matches) {
      if (m.precioUnitario < best.precioUnitario) best = m;
    }

    const cantidad = material.cantidad;
    const subtotal = Math.round(cantidad * best.precioUnitario * 100) / 100;
    lineas.push({
      lineaMaterialId: material.id,
      ferreteriaId: best.ferreteriaId,
      cantidad,
      precioUnitario: best.precioUnitario,
      subtotal,
    });
  }

  const totalOptimizado =
    Math.round(lineas.reduce((s, l) => s + l.subtotal, 0) * 100) / 100;

  // Total si se compra TODO en una sola ferretería (la más barata globalmente)
  let totalMejorGlobal = Number.POSITIVE_INFINITY;
  for (const ferreteriaId of ferreteriaIds) {
    let total = 0;
    let completo = true;
    for (const material of lineasMaterial) {
      const match = cotizaciones.find(
        (c) => c.lineaMaterialId === material.id && c.ferreteriaId === ferreteriaId
      );
      if (!match) {
        completo = false;
        break;
      }
      total += material.cantidad * match.precioUnitario;
    }
    if (completo && total < totalMejorGlobal) {
      totalMejorGlobal = total;
    }
  }

  if (!Number.isFinite(totalMejorGlobal)) {
    totalMejorGlobal = totalOptimizado;
  } else {
    totalMejorGlobal = Math.round(totalMejorGlobal * 100) / 100;
  }

  const ahorroEstimado = Math.max(
    0,
    Math.round((totalMejorGlobal - totalOptimizado) * 100) / 100
  );

  return { lineas, totalOptimizado, totalMejorGlobal, ahorroEstimado };
}
