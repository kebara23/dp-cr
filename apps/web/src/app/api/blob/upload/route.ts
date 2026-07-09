import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const maxDuration = 30;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireSession(["ADMIN"]);
        // Keep uploads under laminas/ for organization
        if (!pathname.startsWith("laminas/")) {
          throw new Error("pathname inválido");
        }
        return {
          allowedContentTypes: [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
          ],
          // 100 MB — planos reales
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Registration happens via POST /api/proyectos/[id]/laminas after client upload
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Error de upload";
    const status =
      message === "UNAUTHORIZED" || message === "FORBIDDEN" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
