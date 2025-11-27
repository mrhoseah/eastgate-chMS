import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update system setting
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
      value,
      type,
      category,
      label,
      description,
      isPublic,
      isEditable,
    } = body;

    const oldSetting = await prisma.systemSetting.findUnique({
      where: { id: params.id },
    });

    if (!oldSetting) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    if (!oldSetting.isEditable) {
      return NextResponse.json(
        { error: "This setting cannot be edited" },
        { status: 403 }
      );
    }

    const setting = await prisma.systemSetting.update({
      where: { id: params.id },
      data: {
        value,
        type,
        category,
        label,
        description,
        isPublic,
        isEditable,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "SYSTEM_SETTING_CHANGE",
        entity: "SystemSetting",
        entityId: setting.id,
        entityName: setting.key,
        description: `Updated system setting: ${setting.key}`,
        metadata: { oldSetting, newSetting: setting },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(setting);
  } catch (error: any) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
