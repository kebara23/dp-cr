import { LoginForm } from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Diego Porras</h1>
        <p className="text-slate-600 mt-2">Plataforma de Ingeniería Civil — CTK + Agente IA</p>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-lg border">
        <LoginForm />
      </div>
    </main>
  );
}
