import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        invitationType: "system",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error("Error fetching system invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body;

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role is a system role
    const validSystemRoles = ["SUPERADMIN", "SYSTEM_ADMIN", "SYSTEM_SUPPORT"];
    if (!validSystemRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid system role" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check for pending invitation
    const pendingInvitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        status: "pending",
        invitationType: "system",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (pendingInvitation) {
      return NextResponse.json(
        { error: "Pending invitation already exists for this email" },
        { status: 409 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        token,
        invitationType: "system",
        expiresAt,
        invitedById: session.user.id,
      },
    });

    // TODO: Send invitation email
    // await sendInvitationEmail(email, token, role);

    return NextResponse.json(invitation);
  } catch (error: any) {
    console.error("Error creating system invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
