import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single church
export async function GET(
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
      select: { role: true },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const church = await prisma.church.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            campuses: true,
            accounts: true,
          },
        },
        subscription: true,
        settings: true,
      },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    return NextResponse.json(church);
  } catch (error: any) {
    console.error("Error fetching church:", error);
    return NextResponse.json(
      { error: "Failed to fetch church" },
      { status: 500 }
    );
  }
}

// PUT - Update church
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
      name,
      denomination,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      timezone,
      language,
      currency,
      isActive,
      isSponsored,
      unlimitedUse,
    } = body;

    const oldChurch = await prisma.church.findUnique({
      where: { id: params.id },
    });

    if (!oldChurch) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    const church = await prisma.church.update({
      where: { id: params.id },
      data: {
        name,
        denomination,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        website,
        timezone,
        language,
        currency,
        isActive,
        isSponsored,
        unlimitedUse,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "UPDATE",
        entity: "Church",
        entityId: church.id,
        entityName: church.name,
        description: `Updated church: ${church.name}`,
        metadata: { oldChurch, newChurch: church },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(church);
  } catch (error: any) {
    console.error("Error updating church:", error);
    return NextResponse.json(
      { error: "Failed to update church" },
      { status: 500 }
    );
  }
}

// DELETE - Delete church
export async function DELETE(
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

    const church = await prisma.church.findUnique({
      where: { id: params.id },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    await prisma.church.delete({
      where: { id: params.id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "DELETE",
        entity: "Church",
        entityId: church.id,
        entityName: church.name,
        description: `Deleted church: ${church.name}`,
        metadata: { church },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ message: "Church deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting church:", error);
    return NextResponse.json(
      { error: "Failed to delete church" },
      { status: 500 }
    );
  }
}
