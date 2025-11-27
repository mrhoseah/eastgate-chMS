import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - List all biometric devices for the church
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const churchId = session.user.churchId || "default-church-id";

    const devices = await prisma.biometricDevice.findMany({
      where: { churchId },
      include: {
        _count: {
          select: {
            attendanceRecords: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a new biometric device
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      serviceTagId,
      deviceModel,
      location,
      authToken,
      callbackUrl,
    } = body;

    if (!name || !serviceTagId || !authToken) {
      return NextResponse.json(
        { error: "Name, Service Tag ID, and Auth Token are required" },
        { status: 400 }
      );
    }

    const churchId = session.user.churchId || "default-church-id";

    // Generate callback URL if not provided
    const finalCallbackUrl =
      callbackUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/biometric/callback?stgid=${serviceTagId}`;

    const device = await prisma.biometricDevice.create({
      data: {
        name,
        serviceTagId,
        deviceModel: deviceModel || "Unknown",
        location: location || "",
        authToken,
        callbackUrl: finalCallbackUrl,
        churchId,
        isActive: true,
      },
    });

    return NextResponse.json({ device }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating device:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Device with this Service Tag ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create device" },
      { status: 500 }
    );
  }
}

