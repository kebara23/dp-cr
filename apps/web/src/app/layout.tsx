import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DP-CR | Plataforma Ingeniería Civil",
  description: "MVP slice vertical: corpus, metrados, presupuestos, agente IA.",
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "placeholder";

  if (hasClerkKey) {
    const { ClerkProvider } = require("@clerk/nextjs");
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
