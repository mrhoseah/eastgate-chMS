import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Generate church-specific icon from logo
 * GET /api/church/[id]/icon/[size]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; size: string }> }
) {
  try {
    const { id, size } = await params;
    const sizeNum = parseInt(size, 10);

    if (![72, 96, 128, 144, 152, 192, 384, 512].includes(sizeNum)) {
      return NextResponse.json(
        { error: "Invalid icon size" },
        { status: 400 }
      );
    }

    const church = await prisma.church.findUnique({
      where: { id },
      select: { logo: true },
    });

    if (!church || !church.logo) {
      // Return default icon (prefer SVG if available)
      return NextResponse.redirect(new URL(`/icons/icon-${size}x${size}.svg`, request.url));
    }

    // If logo is a URL, we can use it directly or generate a resized version
    // For now, redirect to the logo (you might want to implement image resizing)
    // In production, you'd want to use an image service like Cloudinary or ImageKit
    // to resize the logo to the requested size
    
    // For now, return the logo URL or default icon
    if (church.logo.startsWith("http")) {
      // External URL - redirect to it
      return NextResponse.redirect(church.logo);
    } else {
      // Local path - redirect to it
      return NextResponse.redirect(new URL(church.logo, request.url));
    }
  } catch (error: any) {
    console.error("Error getting church icon:", error);
    // Fallback to default icon
    const { size } = await params;
  return NextResponse.redirect(new URL(`/icons/icon-${size}x${size}.svg`, request.url));
  }
}

