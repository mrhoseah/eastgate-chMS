/**
 * PowerPoint Import Route (Professional Edition)
 * --------------------------------------------------
 * Handles .PPTX uploads, extracts slides using multiple
 * fallback parsers, and creates structured presentation
 * data in Prisma. Designed for robustness, clarity, and
 * maintainability — modular structure.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/* -------------------------------------------------- */
/*                XML TEXT EXTRACTION                 */
/* -------------------------------------------------- */

/**
 * Extract text from PowerPoint XML slides.
 * Tries multiple tag structures (<a:t>, <t>, <p>, etc.)
 * and decodes XML entities safely.
 */
function extractTextFromXml(xml: string): string[] {
  const texts: string[] = [];
  const textPatterns = [
    /<a:t[^>]*>([^<]*)<\/a:t>/gi,
    /<[^:]*:t[^>]*>([^<]*)<\/[^:]*:t>/gi,
    /<t[^>]*>([^<]*)<\/t>/gi,
  ];

  // Primary text extraction
  for (const pattern of textPatterns) {
    const matches = xml.matchAll(pattern);
    for (const match of matches) {
      const text = decodeXml(match[1]);
      if (text && !texts.includes(text)) texts.push(text);
    }
  }

  // Paragraph fallback
  if (texts.length === 0) {
    const paraPatterns = [
      /<a:p[^>]*>([\s\S]*?)<\/a:p>/gi,
      /<[^:]*:p[^>]*>([\s\S]*?)<\/[^:]*:p>/gi,
    ];
    for (const pattern of paraPatterns) {
      for (const para of xml.matchAll(pattern)) {
        extractTextFromXml(para[1]).forEach((t) => {
          if (!texts.includes(t)) texts.push(t);
        });
      }
    }
  }

  // Fallback: any visible text between tags
  if (texts.length === 0) {
    (xml.match(/>([^<]+)</g) || []).forEach((match) => {
      const raw = match.match(/>([^<]+)</)?.[1];
      const text = decodeXml(raw);
      if (text && !text.startsWith("<")) texts.push(text);
    });
  }

  return [...new Set(texts)].filter(Boolean);
}

/** Decode XML entities to readable text */
function decodeXml(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .trim();
}

/* -------------------------------------------------- */
/*                  MANUAL PPTX PARSER                */
/* -------------------------------------------------- */

/**
 * Manually extracts slides from a .pptx file using JSZip.
 * Offers reliable fallback when third-party libraries fail.
 */
async function parsePptxFileManual(filePath: string) {
  try {
    const JSZip = (await import("jszip")).default;
    const fileBuffer = await readFile(filePath);
    const zip = await JSZip.loadAsync(fileBuffer);
    const allFiles = Object.keys(zip.files);

    // Locate slide XMLs
    let slideFiles = allFiles.filter((n) => n.startsWith("ppt/slides/slide") && n.endsWith(".xml"));
    if (slideFiles.length === 0)
      slideFiles = allFiles.filter((n) => n.includes("slide") && n.endsWith(".xml"));

    if (slideFiles.length === 0) throw new Error("No slide files found in PowerPoint archive");

    slideFiles.sort((a, b) => parseInt(a.match(/\d+/)?.[0] || "0") - parseInt(b.match(/\d+/)?.[0] || "0"));

    const slides: any[] = [];

    for (const [index, slideFile] of slideFiles.entries()) {
      try {
        const slideXml = await zip.files[slideFile].async("string");
        const texts = extractTextFromXml(slideXml);
        const title = texts[0]?.substring(0, 100) || `Slide ${index + 1}`;
        const content = texts.slice(1).join("\n").substring(0, 2000) || "";

        // Extract images from slide
        const images: string[] = [];
        const imagePattern = /<a:blip[^>]*r:embed="([^"]+)"/gi;
        const imageMatches = slideXml.matchAll(imagePattern);
        
        for (const match of imageMatches) {
          const imageId = match[1];
          // Look for image file in media folder
          const imageFile = allFiles.find(f => f.includes(`media/${imageId}`) || f.includes(`media/image${imageId}`));
          if (imageFile) {
            try {
              const imageData = await zip.files[imageFile].async("base64");
              const imageExt = imageFile.split('.').pop()?.toLowerCase() || 'png';
              images.push(`data:image/${imageExt === 'jpg' ? 'jpeg' : imageExt};base64,${imageData}`);
            } catch (e) {
              console.warn(`Failed to extract image ${imageId}:`, e);
            }
          }
        }

        slides.push({ title, content, text: texts, images });
      } catch {
        slides.push({
          title: `Slide ${index + 1}`,
          content: "Error extracting content from this slide",
          text: [],
          images: [],
        });
      }
    }

    return { slides: slides.length ? slides : [{ title: "Imported Presentation", content: "No extractable content." }] };
  } catch (error: any) {
    console.error("Manual PPTX parsing error:", error);
    throw error;
  }
}

/* -------------------------------------------------- */
/*                 DYNAMIC PARSER CHAIN               */
/* -------------------------------------------------- */

async function parsePptxFile(filePath: string) {
  try {
    return await parsePptxFileManual(filePath);
  } catch (manualError) {
    console.warn("Manual parser failed:", manualError);
  }

  // pptxtojson fallback
  try {
    const mod = await import("pptxtojson");
    const parser = mod.default || mod;
    if (typeof parser === "function") return await parser(filePath);
    if (typeof parser.parse === "function") return await parser.parse(filePath);
  } catch (e) {
    console.warn("pptxtojson failed:", e);
  }

  // pptx2json fallback
  try {
    const mod = await import("pptx2json");
    const parser = mod.default || mod;
    if (parser?.parse) return await parser.parse(filePath);
    if (typeof parser === "function") return await parser(filePath);
  } catch (e) {
    console.error("pptx2json failed:", e);
    throw new Error("Failed to parse PowerPoint file.");
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
    if (!fileName.endsWith(".pptx"))
      return NextResponse.json(
        { error: "Only .pptx files are supported" },
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
    const tempFilePath = join(tempDir, `pptx-${Date.now()}-${safeName}`);

    await writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));

    /* ---------- PARSING ---------- */
    let slidesData: any[] = [];
    const result = await parsePptxFile(tempFilePath);
    slidesData = Array.isArray(result) ? result : result.slides || [];

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
    console.error("PowerPoint import error:", error);
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
  return rawSlides.map((slide, index) => {
    const title = slide.title || `Slide ${index + 1}`;
    const content = slide.content || "";
    const texts = slide.text || [title, content].filter(Boolean);

    const width = 960; // Standard presentation width
    const height = 540; // Standard presentation height (16:9)

    const x = 100 + (index % 3) * 350;
    const y = 100 + Math.floor(index / 3) * 400;

    // Create text elements from extracted content
    const elements: any[] = [];
    
    // Add title as a heading element
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
          fill: '#000000',
          fontWeight: 'bold',
        },
      });
    }

    // Add content as text elements (split by lines or paragraphs)
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

    // If no content lines, add the raw content as a single text element
    if (contentLines.length === 0 && content) {
      elements.push({
        type: 'text',
        content: content.substring(0, 500), // Limit length
        position: { x: 50, y: 100 },
        size: { width: 860, height: 400 },
        rotation: 0,
        style: {
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#000000',
        },
      });
    }

    // Add images from PowerPoint slide
    const images = slide.images || [];
    let imageYOffset = yOffset + (contentLines.length * 60);
    images.forEach((imageData: string, imgIndex: number) => {
      elements.push({
        type: 'image',
        content: imageData,
        position: { 
          x: 50 + (imgIndex % 2) * 450, 
          y: imageYOffset + Math.floor(imgIndex / 2) * 200 
        },
        size: { width: 400, height: 200 },
        rotation: 0,
        style: {},
      });
    });

    return {
      title,
      content, // Keep original content for compatibility
      x,
      y,
      width,
      height,
      order: index,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      metadata: {
        elements: elements,
        importedFrom: 'pptx',
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
