"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const DISCIPLINAS = [
  "ARQUITECTURA",
  "ESTRUCTURA",
  "ELECTRICO",
  "SANITARIO_MECANICO",
  "GENERAL",
  "NOTAS",
  "TABLA",
  "SIMBOLOGIA",
  "DETALLE",
] as const;

const TIPOS = [
  "ARQUITECTURA",
  "ESTRUCTURA",
  "ELECTRICO",
  "SANITARIO_MECANICO",
  "NOTAS",
  "TABLA",
  "SIMBOLOGIA",
  "DETALLE",
  "OTRO",
] as const;

type Disciplina = (typeof DISCIPLINAS)[number];
type Tipo = (typeof TIPOS)[number];

export function LaminasUpload({
  proyectoId,
  nextCodigo,
}: {
  proyectoId: string;
  nextCodigo?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [codigo, setCodigo] = useState(nextCodigo ?? `A-${String(Date.now()).slice(-2)}`);
  const [nombre, setNombre] = useState("");
  const [disciplina, setDisciplina] = useState<Disciplina>("ARQUITECTURA");
  const [tipo, setTipo] = useState<Tipo>("ARQUITECTURA");
  const [escala, setEscala] = useState("1:50");
  const [revision, setRevision] = useState("A");

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setNombre((prev) => prev || picked.name.replace(/\.[^.]+$/, ""));
    setError(null);
    setSuccess(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Seleccione un archivo PDF o imagen");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append(
        "metadata",
        JSON.stringify({
          codigo: codigo.trim() || `A-${String(Date.now()).slice(-2)}`,
          nombre: nombre.trim() || file.name,
          disciplina,
          tipo,
          escala: escala.trim() || undefined,
          revision: revision.trim() || "A",
        })
      );

      const res = await fetch(`/api/proyectos/${proyectoId}/laminas`, {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error
              ? JSON.stringify(data.error)
              : `Error ${res.status} al subir`;
        setError(msg);
        return;
      }

      setSuccess(
        `Lámina ${data.codigo} subida — ${data.estadoProcesamiento}` +
          (data.disciplina ? ` (${data.disciplina})` : "")
      );
      setFile(null);
      setNombre("");
      setCodigo(`A-${String(Date.now()).slice(-2)}`);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red al subir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-700 inline-block">
        {loading ? "Subiendo..." : "+ Subir lámina"}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={onFilePick}
          disabled={loading}
        />
      </label>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSubmit}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">Subir lámina</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">
                  {file?.name ?? "Sin archivo"}
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-sm"
                onClick={() => !loading && setOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600 col-span-1">
                Código
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required
                />
              </label>
              <label className="text-xs text-gray-600 col-span-1">
                Revisión
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                />
              </label>
            </div>

            <label className="text-xs text-gray-600 block">
              Nombre
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">
                Disciplina (sugerida)
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value as Disciplina)}
                >
                  {DISCIPLINAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-600">
                Tipo
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as Tipo)}
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="text-xs text-gray-600 block">
              Escala
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={escala}
                onChange={(e) => setEscala(e.target.value)}
                placeholder="1:50"
              />
            </label>

            <p className="text-xs text-slate-500">
              El servidor clasifica el PDF con el texto extraído y puede sobrescribir
              disciplina/tipo. PDFs escaneados sin texto quedan en PENDIENTE.
            </p>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-lg border text-gray-600"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Subir y analizar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
