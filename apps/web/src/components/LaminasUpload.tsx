"use client";

import { upload } from "@vercel/blob/client";
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

function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function pollLaminaEstado(
  proyectoId: string,
  laminaId: string,
  onUpdate: (estado: string, motivo?: string) => void
): Promise<{ estado: string; disciplina?: string; codigo?: string; motivo?: string }> {
  const maxAttempts = 40;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`/api/proyectos/${proyectoId}/laminas`);
    if (!res.ok) continue;
    const list = (await res.json()) as Array<{
      id: string;
      codigo: string;
      disciplina: string;
      estadoProcesamiento: string;
      metadataJson?: { motivo?: string } | null;
    }>;
    const found = list.find((l) => l.id === laminaId);
    if (!found) continue;
    const motivo =
      found.metadataJson && typeof found.metadataJson === "object"
        ? found.metadataJson.motivo
        : undefined;
    onUpdate(found.estadoProcesamiento, motivo);
    if (
      found.estadoProcesamiento !== "PENDIENTE" &&
      found.estadoProcesamiento !== "PROCESANDO"
    ) {
      return {
        estado: found.estadoProcesamiento,
        disciplina: found.disciplina,
        codigo: found.codigo,
        motivo,
      };
    }
  }
  return { estado: "PROCESANDO" };
}

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
  const [phase, setPhase] = useState<"idle" | "uploading" | "registering" | "processing">(
    "idle"
  );
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
    setPhase("idle");
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
    setProgress(0);

    try {
      // 1) Direct client upload to Vercel Blob (bypasses 4.5MB serverless limit)
      setPhase("uploading");
      const pathname = `laminas/${proyectoId}/${Date.now()}-${safeFilename(file.name)}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        multipart: file.size > 4 * 1024 * 1024,
        contentType: file.type || undefined,
        onUploadProgress: ({ percentage }) => {
          setProgress(Math.round(percentage));
        },
      });

      // 2) Register lamina with Blob URL (small JSON)
      setPhase("registering");
      setProgress(100);
      const res = await fetch(`/api/proyectos/${proyectoId}/laminas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivoUrl: blob.url,
          archivoNombre: file.name,
          tamano: file.size,
          metadata: {
            codigo: codigo.trim() || `A-${String(Date.now()).slice(-2)}`,
            nombre: nombre.trim() || file.name,
            disciplina,
            tipo,
            escala: escala.trim() || undefined,
            revision: revision.trim() || "A",
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error
              ? JSON.stringify(data.error)
              : `Error ${res.status} al registrar`;
        setError(msg);
        return;
      }

      // 3) Poll until processing finishes
      setPhase("processing");
      setSuccess(`Lámina ${data.codigo} registrada — procesando…`);
      const final = await pollLaminaEstado(proyectoId, data.id, (estado, motivo) => {
        if (estado === "PROCESANDO") {
          setSuccess(`Lámina ${data.codigo} — PROCESANDO…`);
        } else if (estado === "PENDIENTE" && motivo) {
          setSuccess(`Lámina ${data.codigo} — PENDIENTE (${motivo})`);
        }
      });

      if (final.estado === "ERROR") {
        setError(
          `Error al analizar: ${final.motivo ?? "revise el archivo"}`
        );
        setSuccess(null);
      } else if (final.estado === "PENDIENTE" && final.motivo === "sin_texto_ocr_pendiente") {
        setSuccess(
          `Lámina ${final.codigo ?? data.codigo} subida — PENDIENTE (PDF sin texto; OCR en Fase B)`
        );
      } else {
        setSuccess(
          `Lámina ${final.codigo ?? data.codigo} — ${final.estado}` +
            (final.disciplina ? ` (${final.disciplina})` : "")
        );
      }

      setFile(null);
      setNombre("");
      setCodigo(`A-${String(Date.now()).slice(-2)}`);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
        setPhase("idle");
        setProgress(0);
      }, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red al subir");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel =
    phase === "uploading"
      ? `Subiendo ${progress}%…`
      : phase === "registering"
        ? "Registrando…"
        : phase === "processing"
          ? "Analizando…"
          : loading
            ? "Procesando…"
            : "Subir y analizar";

  return (
    <div className="relative">
      <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-700 inline-block">
        {loading ? buttonLabel : "+ Subir lámina"}
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
                  {file ? ` (${(file.size / (1024 * 1024)).toFixed(1)} MB)` : ""}
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
                  disabled={loading}
                />
              </label>
              <label className="text-xs text-gray-600 col-span-1">
                Revisión
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  disabled={loading}
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
                disabled={loading}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">
                Disciplina (sugerida)
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value as Disciplina)}
                  disabled={loading}
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
                  disabled={loading}
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
                disabled={loading}
              />
            </label>

            {(phase === "uploading" || progress > 0) && loading && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>
                    {phase === "uploading"
                      ? "Subiendo a Blob…"
                      : phase === "registering"
                        ? "Registrando…"
                        : "Analizando…"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{
                      width: `${phase === "processing" ? 100 : progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Subida directa a almacenamiento (hasta 100 MB). El análisis corre en
              segundo plano. PDFs escaneados sin texto quedan en PENDIENTE hasta OCR
              (Fase B).
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
                {buttonLabel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
