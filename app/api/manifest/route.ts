import { NextRequest, NextResponse } from "next/server";
import { generateChurchManifest } from "@/lib/church-pwa";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Dynamic manifest endpoint - generates church-specific manifest
 * GET /api/manifest
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get church ID from user's session
    let churchId: string | undefined;
    
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const userId = (session.user as any).id;
        if (userId) {
          // Get user's church through their first active church relationship
          // Since users don't have direct churchId, we'll get the active church
          // In a multitenant system, you might want to store churchId in session
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });
          
          // For now, we'll use the active church
          // In production, you'd want to store churchId in the session or user context
        }
      }
    } catch (error) {
      // Session check failed, continue with default
      console.log("Could not get church from session, using active church");
    }

    const manifest = await generateChurchManifest(churchId);

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: any) {
    console.error("Error generating manifest:", error);
    return NextResponse.json(
      { error: "Failed to generate manifest" },
      { status: 500 }
    );
  }
}
