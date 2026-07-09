"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TenantModulosForm({
  tenantId,
  modulos,
}: {
  tenantId: string;
  modulos: Array<{ modulo: string; activo: boolean }>;
}) {
  const router = useRouter();
  const [state, setState] = useState(modulos);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function toggle(modulo: string) {
    setState((prev) =>
      prev.map((m) => (m.modulo === modulo ? { ...m, activo: !m.activo } : m))
    );
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/super-admin/tenants/${tenantId}/modulos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modulos: state }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Módulos actualizados");
      router.refresh();
    } else {
      setMsg("Error al guardar");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {state.map((m) => (
          <label
            key={m.modulo}
            className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer ${
              m.activo ? "border-blue-300 bg-blue-50" : "bg-white"
            }`}
          >
            <input type="checkbox" checked={m.activo} onChange={() => toggle(m.modulo)} />
            {m.modulo}
          </label>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar módulos"}
      </button>
      {msg && <p className="text-xs text-green-700 mt-2">{msg}</p>}
    </div>
  );
}
