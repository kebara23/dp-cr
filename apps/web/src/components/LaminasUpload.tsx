"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LaminasUpload({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append(
      "metadata",
      JSON.stringify({
        codigo: `A-${String(Date.now()).slice(-2)}`,
        nombre: file.name,
        disciplina: "ARQUITECTURA",
        tipo: "ARQUITECTURA",
        escala: "1:50",
        revision: "A",
      })
    );
    await fetch(`/api/proyectos/${proyectoId}/laminas`, { method: "POST", body: form });
    setLoading(false);
    router.refresh();
  }

  return (
    <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-700">
      {loading ? "Subiendo..." : "+ Subir lámina"}
      <input type="file" accept=".pdf,.png,.jpg" className="hidden" onChange={onChange} />
    </label>
  );
}
