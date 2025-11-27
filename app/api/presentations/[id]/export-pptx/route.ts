/**
 * PowerPoint Export Route
 * --------------------------------------------------
 * Exports a presentation as a .pptx file using pptxgenjs
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PptxGenJS from "pptxgenjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch presentation
    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { order: "asc" },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    // Check access (same church or public)
    if (!presentation.isPublic) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          campus: { select: { churchId: true } },
        },
      });

      if (user?.campus?.churchId !== presentation.churchId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Create PowerPoint presentation
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 16:9 aspect ratio
    pptx.author = presentation.createdBy?.firstName || "Unknown";
    pptx.company = "Church Management System";
    pptx.title = presentation.title;
    pptx.subject = presentation.description || "";

    // Convert slides to PowerPoint slides
    for (const slide of presentation.slides) {
      const pptxSlide = pptx.addSlide();

      // Set background color if available
      if (slide.backgroundColor) {
        pptxSlide.background = { color: slide.backgroundColor };
      }

      // Add title
      if (slide.title) {
        pptxSlide.addText(slide.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.8,
          fontSize: 32,
          bold: true,
          align: "left",
          color: slide.textColor || "363636",
        });
      }

      // Add content
      if (slide.content) {
        // Split content into paragraphs
        const paragraphs = slide.content.split("\n").filter((p) => p.trim());
        
        let yPos = 1.5;
        for (const para of paragraphs.slice(0, 10)) {
          // Limit to 10 paragraphs per slide
          pptxSlide.addText(para, {
            x: 0.5,
            y: yPos,
            w: 9,
            h: 0.4,
            fontSize: 18,
            align: "left",
            color: slide.textColor || "363636",
          });
          yPos += 0.5;
        }
      }
    }

    // Generate PowerPoint file
    const buffer = await pptx.write({ outputType: "nodebuffer" });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          presentation.title || "presentation"
        )}.pptx"`,
      },
    });
  } catch (error: any) {
    console.error("PowerPoint export error:", error);
    return NextResponse.json(
      { error: error.message || "Export failed" },
      { status: 500 }
    );
  }
}

