"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@diego-porras.cr");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error de autenticación");
      setLoading(false);
      return;
    }

    if (data.user.role === "CLIENTE") {
      router.push("/cliente");
    } else {
      router.push("/admin");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      <p className="text-xs text-slate-500 text-center">
        Demo Admin: admin@diego-porras.cr / admin123<br />
        Demo Cliente: cliente@ejemplo.cr / cliente123
      </p>
    </form>
  );
}
