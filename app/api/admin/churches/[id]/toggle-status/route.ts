import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Toggle church active status
export async function PATCH(
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
    const { isActive } = body;

    const church = await prisma.church.update({
      where: { id: params.id },
      data: { isActive },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "TOGGLE_STATUS",
        entity: "Church",
        entityId: church.id,
        entityName: church.name,
        description: `${isActive ? "Activated" : "Deactivated"} church: ${church.name}`,
        metadata: { isActive },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(church);
  } catch (error: any) {
    console.error("Error toggling church status:", error);
    return NextResponse.json(
      { error: "Failed to toggle church status" },
      { status: 500 }
    );
  }
}
