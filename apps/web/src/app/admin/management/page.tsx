"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManagementPage() {
  const [fuentes, setFuentes] = useState<Array<{ id: string; nombre: string; _count: { items: number } }>>([]);

  useEffect(() => {
    fetch("/api/management").then((r) => r.json()).then((d) => setFuentes(d.fuentes ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4">
        <Link href="/admin" className="text-sm text-primary">← Admin</Link>
        <h1 className="text-xl font-bold mt-1">Management</h1>
        <p className="text-sm text-slate-500">Fuentes de precio, reglas y pack CTK CR-RESIDENCIAL-V1</p>
      </header>
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Fuentes de precio</h2>
          {fuentes.map((f) => (
            <div key={f.id} className="flex justify-between py-2 border-b text-sm">
              <span>{f.nombre}</span>
              <span className="text-slate-500">{f._count.items} ítems</span>
            </div>
          ))}
        </section>
        <section className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-2">Pack CTK</h2>
          <p className="text-sm text-slate-600">
            CR-RESIDENCIAL-V1 precargado con notas generales, eléctricas ARESEP, mecánicas CFIA,
            tablas de acero/dosificación/centro de carga, y simbología.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Archivos en <code>data/ctk-packs/cr-residencial-v1/</code>
          </p>
        </section>
        <section className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-2">Auditoría</h2>
          <Link href="/admin/auditoria" className="text-sm text-primary hover:underline">
            Ver log de eventos →
          </Link>
        </section>
      </main>
    </div>
  );
}
