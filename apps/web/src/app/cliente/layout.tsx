export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Portal Cliente</h1>
            <p className="text-xs text-gray-500">Casa Residencial Terraba — Puerto Cortés, Osa</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Actualizado</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-6 px-6">
        {children}
      </main>
    </div>
  );
}
