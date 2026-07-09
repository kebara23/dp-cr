"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TenantUsuarioForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/super-admin/tenants/${tenantId}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setName("");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-3 border-t pt-4">
      <input
        placeholder="Nombre"
        className="border rounded-lg px-3 py-2 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        placeholder="Email"
        type="email"
        className="border rounded-lg px-3 py-2 text-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Contraseña"
        className="border rounded-lg px-3 py-2 text-sm"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <select
        className="border rounded-lg px-3 py-2 text-sm"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="ADMIN">ADMIN</option>
        <option value="CLIENTE">CLIENTE</option>
      </select>
      {error && <p className="text-red-600 text-sm md:col-span-2">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="md:col-span-2 bg-slate-900 text-white py-2 rounded-xl text-sm disabled:opacity-50"
      >
        {loading ? "Creando..." : "+ Agregar usuario"}
      </button>
    </form>
  );
}
