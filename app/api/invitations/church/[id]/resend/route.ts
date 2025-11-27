import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/invitation-email";

// POST - Resend invitation
export async function POST(
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
      select: { 
        role: true,
        firstName: true,
        lastName: true,
        campus: {
          select: { church: { select: { name: true } } }
        }
      },
    });

    if (!["ADMIN", "SUPERADMIN"].includes(user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: params.id },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Extend expiration
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await prisma.invitation.update({
      where: { id: params.id },
      data: { expiresAt: newExpiresAt },
    });

    // Resend email
    const inviteUrl = `${process.env.NEXTAUTH_URL || request.headers.get("origin")}/auth/accept-invite/${invitation.token}`;
    
    try {
      await sendInvitationEmail(
        invitation.email,
        {
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          role: invitation.role,
          churchName: user?.campus?.church?.name || "the church",
          inviterName: `${user?.firstName} ${user?.lastName}`,
          message: invitation.message || undefined,
          inviteUrl,
        },
        invitation.churchId || undefined
      );
    } catch (emailError) {
      console.error("Error resending invitation email:", emailError);
    }

    return NextResponse.json({ message: "Invitation resent" });
  } catch (error: any) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}
