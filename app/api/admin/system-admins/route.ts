import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCognitoUser } from "@/lib/cognito";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN can access this
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all SUPERADMIN users (no church association)
    const systemAdmins = await prisma.user.findMany({
      where: {
        role: "SUPERADMIN",
        campusId: null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        canLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(systemAdmins);
  } catch (error) {
    console.error("Error fetching system admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch system admins" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN can create system admins
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, phone, firstName, lastName, password } = body;

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    // Create user in Cognito
    try {
      await createCognitoUser(email, password, firstName, lastName, phone);
    } catch (cognitoError: any) {
      console.error("Cognito error:", cognitoError);
      if (!cognitoError.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "Failed to create Cognito user: " + cognitoError.message },
          { status: 500 }
        );
      }
    }

    // Create system admin in database
    const newAdmin = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        firstName,
        lastName,
        role: "SUPERADMIN",
        status: "ACTIVE",
        canLogin: true,
        emailVerified: true,
        phoneVerified: phone ? true : false,
        campusId: null, // No church association
      },
    });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    console.error("Error creating system admin:", error);
    return NextResponse.json(
      { error: "Failed to create system admin" },
      { status: 500 }
    );
  }
}
