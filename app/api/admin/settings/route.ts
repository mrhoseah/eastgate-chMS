import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all system settings (SUPERADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST - Create new system setting (SUPERADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, firstName: true, lastName: true },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      key,
      value,
      type,
      category,
      label,
      description,
      isPublic,
      isEditable,
    } = body;

    if (!key || !label || value === undefined) {
      return NextResponse.json(
        { error: "Key, label, and value are required" },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Setting with this key already exists" },
        { status: 400 }
      );
    }

    const setting = await prisma.systemSetting.create({
      data: {
        key,
        value,
        type: type || "STRING",
        category: category || "general",
        label,
        description,
        isPublic: isPublic ?? false,
        isEditable: isEditable ?? true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "CREATE",
        entity: "SystemSetting",
        entityId: setting.id,
        entityName: setting.key,
        description: `Created system setting: ${setting.key}`,
        metadata: { setting },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error: any) {
    console.error("Error creating setting:", error);
    return NextResponse.json(
      { error: "Failed to create setting" },
      { status: 500 }
    );
  }
}
