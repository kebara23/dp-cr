import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma, UserRole } from "@diego-porras/database";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "diego-porras-dev-secret"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(roles?: UserRole[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function logAuditoria(
  accion: string,
  entidad: string,
  userId?: string,
  proyectoId?: string,
  entidadId?: string,
  detalle?: Record<string, unknown>
) {
  await prisma.auditoriaEvento.create({
    data: {
      accion,
      entidad,
      userId,
      proyectoId,
      entidadId,
      detalleJson: (detalle ?? {}) as object,
    },
  });
}
