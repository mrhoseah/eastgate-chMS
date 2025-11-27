import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST - Add user to biometric device via Cams RESTful API
 * This would typically call the Cams API to add a user to the device
 * For now, we'll store the mapping and return instructions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, deviceId, biometricUserId } = body;

    if (!userId || !deviceId || !biometricUserId) {
      return NextResponse.json(
        { error: "User ID, Device ID, and Biometric User ID are required" },
        { status: 400 }
      );
    }

    // Update user with biometric user ID
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        biometricUserId: biometricUserId.toString(),
      },
    });

    // Get device details
    const device = await prisma.biometricDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // In production, you would call the Cams RESTful API here
    // Example: POST to Cams API endpoint to add user to device
    // const camsResponse = await fetch(`https://api.camsbiometrics.com/...`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     CommandName: 'Add',
    //     CommandEntity: 'User',
    //     OperationData: { ... },
    //     AuthToken: device.authToken,
    //   })
    // });

    return NextResponse.json({
      success: true,
      message: "User mapped to biometric device",
      user,
      device,
      instructions: {
        note: "To complete the setup, you need to add this user to the device using the Cams API Monitor or RESTful API",
        camsApiEndpoint: "Use Cams RESTful API to add user",
        biometricUserId: biometricUserId,
        serviceTagId: device.serviceTagId,
      },
    });
  } catch (error: any) {
    console.error("Error adding user to device:", error);
    return NextResponse.json(
      { error: "Failed to add user to device" },
      { status: 500 }
    );
  }
}

