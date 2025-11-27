/**
 * PDF Import Route
 * --------------------------------------------------
 * Handles .PDF uploads, extracts pages using pdf-parse,
 * and creates structured presentation data in Prisma.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/* -------------------------------------------------- */
/*                  PDF PARSER                       */
/* -------------------------------------------------- */

async function parsePdfFile(filePath: string) {
  try {
    const fs = await import("fs/promises");
    const dataBuffer = await fs.readFile(filePath);
    
    // Try to use pdfjs-dist for better page rendering
    let pdfPages: any[] = [];
    let numPages = 0;
    let text = "";
    
    try {
      // Try pdfjs-dist for rendering pages as images
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
      const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
      const pdf = await loadingTask.promise;
      numPages = pdf.numPages;
      
      // Extract text and render pages
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        text += pageText + "\n";
        
        // Render page as image
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = require("canvas");
        const pdfCanvas = canvas.createCanvas(viewport.width, viewport.height);
        const context = pdfCanvas.getContext("2d");
        
        await page.render({
          canvasContext: context as any,
          viewport: viewport,
        }).promise;
        
        const imageData = pdfCanvas.toDataURL("image/png");
        pdfPages.push({
          pageNumber: i,
          image: imageData,
          text: pageText,
        });
      }
    } catch (pdfjsError) {
      console.warn("pdfjs-dist failed, falling back to pdf-parse:", pdfjsError);
      
      // Fallback to pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(dataBuffer);
      text = data.text;
      numPages = data.numpages;
      
      // Create slides with text only (no images)
      for (let i = 0; i < numPages; i++) {
        pdfPages.push({
          pageNumber: i + 1,
          image: null,
          text: text.substring((text.length / numPages) * i, (text.length / numPages) * (i + 1)),
        });
      }
    }

    // Convert pages to slides
    const slides: any[] = [];
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const linesPerPage = Math.max(1, Math.floor(lines.length / numPages));

    for (let i = 0; i < pdfPages.length; i++) {
      const page = pdfPages[i];
      const startLine = i * linesPerPage;
      const endLine = Math.min((i + 1) * linesPerPage, lines.length);
      const slideLines = lines.slice(startLine, endLine);

      const title = slideLines[0]?.substring(0, 100) || `Slide ${i + 1}`;
      const content = slideLines.slice(1).join("\n").substring(0, 2000) || "";

      slides.push({
        title,
        content,
        text: slideLines,
        pageNumber: page.pageNumber,
        image: page.image, // Base64 image data
      });
    }

    return { slides };
  } catch (error: any) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF file: ${error.message}`);
  }
}

/* -------------------------------------------------- */
/*                     MAIN ROUTE                     */
/* -------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    /* ---------- AUTH ---------- */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    /* ---------- FILE INPUT ---------- */
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "Imported Presentation";

    if (!file)
      return NextResponse.json({ error: "File is required" }, { status: 400 });

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf"))
      return NextResponse.json(
        { error: "Only .pdf files are supported" },
        { status: 400 }
      );

    /* ---------- CHURCH CONTEXT ---------- */
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        campus: { select: { churchId: true } },
      },
    });

    let churchId =
      user?.campus?.churchId ||
      (await ensureChurch()) ||
      (await createDefaultChurch());

    /* ---------- TEMP FILE ---------- */
    const tempDir = join(process.cwd(), "tmp");
    if (!existsSync(tempDir)) await mkdir(tempDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const tempFilePath = join(tempDir, `pdf-${Date.now()}-${safeName}`);

    await writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));

    /* ---------- PARSING ---------- */
    const result = await parsePdfFile(tempFilePath);
    const slidesData = result.slides || [];

    const slides = formatSlides(slidesData, title);

    /* ---------- SAVE TO DATABASE ---------- */
    const presentation = await prisma.presentation.create({
      data: {
        title,
        description: `Imported from ${file.name}`,
        isPublic: false,
        presenterUserId: session.user.id,
        createdById: session.user.id,
        churchId,
        slides: { create: slides },
      },
      include: { slides: { orderBy: { order: "asc" } } },
    });

    // Assign current slide
    if (presentation.slides[0]) {
      await prisma.presentation.update({
        where: { id: presentation.id },
        data: { currentSlideId: presentation.slides[0].id },
      });
      presentation.currentSlideId = presentation.slides[0].id;
    }

    await unlink(tempFilePath).catch(() => {});
    return NextResponse.json(
      {
        presentation,
        message: `Imported ${slides.length} slide(s) successfully!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("PDF import error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------- */
/*                   HELPER FUNCS                     */
/* -------------------------------------------------- */

function formatSlides(rawSlides: any[], fallbackTitle: string) {
  const width = 960; // Standard presentation width
  const height = 540; // Standard presentation height (16:9)

  return rawSlides.map((slide, index) => {
    const title = slide.title || `Slide ${index + 1}`;
    const content = slide.content || "";
    const elements: any[] = [];

    // If PDF page has an image, use it as background or main element
    if (slide.image) {
      // Use image as background
      elements.push({
        type: 'image',
        content: slide.image,
        position: { x: 0, y: 0 },
        size: { width, height },
        rotation: 0,
        style: {},
      });
    }

    // Add title if available
    if (title && title !== `Slide ${index + 1}`) {
      elements.push({
        type: 'text',
        content: title,
        position: { x: 50, y: 50 },
        size: { width: 860, height: 80 },
        rotation: 0,
        style: {
          fontSize: 48,
          fontFamily: 'Arial',
          fill: slide.image ? '#ffffff' : '#000000',
          fontWeight: 'bold',
        },
      });
    }

    // Add content as text elements if not using image
    if (!slide.image && content) {
      const contentLines = content.split('\n').filter(line => line.trim());
      let yOffset = title && title !== `Slide ${index + 1}` ? 150 : 100;
      
      contentLines.forEach((line: string, lineIndex: number) => {
        if (line.trim()) {
          elements.push({
            type: 'text',
            content: line.trim(),
            position: { x: 50, y: yOffset + (lineIndex * 60) },
            size: { width: 860, height: 50 },
            rotation: 0,
            style: {
              fontSize: 24,
              fontFamily: 'Arial',
              fill: '#000000',
            },
          });
        }
      });
    }

    const x = 100 + (index % 3) * 350;
    const y = 100 + Math.floor(index / 3) * 400;

    return {
      title,
      content,
      x,
      y,
      width,
      height,
      order: index,
      backgroundColor: slide.image ? null : '#ffffff',
      textColor: '#000000',
      metadata: {
        elements: elements,
        importedFrom: 'pdf',
      },
    };
  });
}

async function ensureChurch() {
  const church = await prisma.church.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  return church?.id;
}

async function createDefaultChurch() {
  const church = await prisma.church.create({
    data: {
      name: "Default Church",
      isActive: true,
      timezone: "UTC",
      language: "en",
      currency: "USD",
    },
    select: { id: true },
  });
  return church.id;
}

