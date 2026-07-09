import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">DP-CR</h1>
        <p className="text-xl text-gray-700 mb-8">
          Plataforma Ingeniería Civil: CTK + Metrados + Agente IA
        </p>
        <div className="space-x-4">
          <Link
            href="/admin"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Admin
          </Link>
          <Link
            href="/cliente"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
          >
            Cliente
          </Link>
        </div>
      </div>
    </main>
  );
}
