import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma, UserRole, Modulo } from "@diego-porras/database";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "diego-porras-dev-secret"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string | null;
}

export interface SessionTenant {
  id: string;
  nombre: string;
  slug: string;
  logoUrl?: string | null;
  modulos: Modulo[];
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

export async function getTenantContext(session: SessionUser): Promise<SessionTenant | null> {
  if (!session.tenantId) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { modulos: true },
  });
  if (!tenant || !tenant.activo) return null;
  return {
    id: tenant.id,
    nombre: tenant.nombre,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    modulos: tenant.modulos.filter((m) => m.activo).map((m) => m.modulo),
  };
}

export async function getActiveProyecto(session: SessionUser) {
  if (session.role === "SUPER_ADMIN") return null;
  const where =
    session.role === "ADMIN"
      ? session.tenantId
        ? { tenantId: session.tenantId }
        : { adminId: session.id }
      : { clientes: { some: { userId: session.id } } };

  return prisma.proyecto.findFirst({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          laminas: true,
          listasCantidades: true,
          presupuestos: true,
          documentosConocimiento: true,
        },
      },
    },
  });
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
