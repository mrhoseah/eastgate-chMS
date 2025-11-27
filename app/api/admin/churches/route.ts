import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all churches (SUPERADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN can access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const churches = await prisma.church.findMany({
      select: {
        id: true,
        name: true,
        denomination: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        isActive: true,
        isSponsored: true,
        unlimitedUse: true,
        createdAt: true,
        _count: {
          select: {
            campuses: true,
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(churches);
  } catch (error: any) {
    console.error("Error fetching churches:", error);
    return NextResponse.json(
      { error: "Failed to fetch churches" },
      { status: 500 }
    );
  }
}

// POST - Create new church (SUPERADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN can access
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

    if (!name) {
      return NextResponse.json(
        { error: "Church name is required" },
        { status: 400 }
      );
    }

    const church = await prisma.church.create({
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
        timezone: timezone || "UTC",
        language: language || "en",
        currency: currency || "USD",
        isActive: isActive ?? true,
        isSponsored: isSponsored ?? false,
        unlimitedUse: unlimitedUse ?? false,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "CREATE",
        entity: "Church",
        entityId: church.id,
        entityName: church.name,
        description: `Created church: ${church.name}`,
        metadata: { church },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(church, { status: 201 });
  } catch (error: any) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      { error: "Failed to create church" },
      { status: 500 }
    );
  }
}
