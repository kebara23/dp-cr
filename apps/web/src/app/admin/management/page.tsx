"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManagementPage() {
  const [fuentes, setFuentes] = useState<
    Array<{ id: string; nombre: string; _count: { items: number } }>
  >([]);

  useEffect(() => {
    fetch("/api/management")
      .then((r) => r.json())
      .then((d) => setFuentes(d.fuentes ?? []));
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Management</h1>
      <p className="text-sm text-slate-500 mt-1">
        Fuentes de precio, reglas y pack CTK CR-RESIDENCIAL-V1
      </p>

      <div className="mt-6 space-y-6">
        <section className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Fuentes de precio</h2>
          {fuentes.map((f) => (
            <div key={f.id} className="flex justify-between py-2 border-b text-sm">
              <span>{f.nombre}</span>
              <span className="text-slate-500">{f._count.items} ítems</span>
            </div>
          ))}
          {fuentes.length === 0 && (
            <p className="text-sm text-slate-400">Sin fuentes. Ejecute el seed.</p>
          )}
        </section>
        <section className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-2">Pack CTK</h2>
          <p className="text-sm text-slate-600">
            CR-RESIDENCIAL-V1 precargado con notas generales, eléctricas ARESEP, mecánicas CFIA,
            tablas de acero/dosificación/centro de carga, y simbología.
          </p>
        </section>
        <section className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-2">Auditoría</h2>
          <Link href="/admin/auditoria" className="text-sm text-blue-600 hover:underline">
            Ver log de eventos →
          </Link>
        </section>
      </div>
    </div>
  );
}
