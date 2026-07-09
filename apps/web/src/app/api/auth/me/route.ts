import { NextResponse } from "next/server";
import { getSession, getTenantContext } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  const tenant = await getTenantContext(session);
  return NextResponse.json({
    user: session,
    tenant,
  });
}
