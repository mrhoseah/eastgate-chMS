import { NextRequest, NextResponse } from "next/server";
import { getChurchPWAConfig } from "@/lib/church-pwa";

/**
 * Get church-specific PWA configuration for client-side use
 * GET /api/pwa/config
 */
export async function GET(request: NextRequest) {
  try {
    const config = await getChurchPWAConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Error getting PWA config:", error);
    return NextResponse.json(
      { error: "Failed to get PWA config" },
      { status: 500 }
    );
  }
}

