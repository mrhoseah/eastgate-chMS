import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/invitation-email";
import crypto from "crypto";

// GET - Fetch church invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, campusId: true, campus: { select: { churchId: true } } },
    });

    // Must be ADMIN or higher
    if (!["ADMIN", "SUPERADMIN"].includes(user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get church ID from user's campus
    const churchId = user?.campus?.churchId;
    if (!churchId && user?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "User not associated with a church" },
        { status: 400 }
      );
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        invitationType: "church",
        churchId: churchId,
      },
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST - Create church invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true, 
        campusId: true, 
        campus: { 
          select: { churchId: true, church: { select: { name: true } } } 
        },
        firstName: true,
        lastName: true,
      },
    });

    // Must be ADMIN or higher
    if (!["ADMIN", "SUPERADMIN"].includes(user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, phone, role, message } = body;

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, first name, last name, and role are required" },
        { status: 400 }
      );
    }

    // Validate role - only allow church roles
    const allowedRoles = ["ADMIN", "EDITOR", "VIEWER", "PASTOR", "LEADER", "FINANCE", "MEMBER"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role for church invitation" },
        { status: 400 }
      );
    }

    // Get church ID
    const churchId = user?.campus?.churchId;
    if (!churchId && user?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "User not associated with a church" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Active invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        token,
        email,
        firstName,
        lastName,
        phone,
        role,
        invitationType: "church",
        churchId,
        campusId: user?.campusId,
        invitedById: session.user.id,
        message,
        expiresAt,
      },
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL || request.headers.get("origin")}/auth/accept-invite/${token}`;
    
    try {
      await sendInvitationEmail(
        email,
        {
          firstName,
          lastName,
          role,
          churchName: user?.campus?.church?.name || "the church",
          inviterName: `${user?.firstName} ${user?.lastName}`,
          message,
          inviteUrl,
        },
        churchId
      );
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't fail the invitation creation if email fails
    }

    return NextResponse.json(invitation, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
