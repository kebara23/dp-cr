import type { Metadata } from "next";
import "./globals.css";
import { DevSwCleanup } from "@/components/DevSwCleanup";

export const metadata: Metadata = {
  title: "Diego Porras — Ingeniería Civil",
  description: "Plataforma de metrados, presupuestos y cotizaciones desde planos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <DevSwCleanup />
        {children}
      </body>
    </html>
  );
}
