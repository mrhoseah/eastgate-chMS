import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Get device details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = await prisma.biometricDevice.findUnique({
      where: { id: params.id },
      include: {
        attendanceRecords: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ device });
  } catch (error: any) {
    console.error("Error fetching device:", error);
    return NextResponse.json(
      { error: "Failed to fetch device" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update device
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, authToken, isActive, callbackUrl } = body;

    const device = await prisma.biometricDevice.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(location !== undefined && { location }),
        ...(authToken && { authToken }),
        ...(isActive !== undefined && { isActive }),
        ...(callbackUrl && { callbackUrl }),
      },
    });

    return NextResponse.json({ device });
  } catch (error: any) {
    console.error("Error updating device:", error);
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.biometricDevice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting device:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}

