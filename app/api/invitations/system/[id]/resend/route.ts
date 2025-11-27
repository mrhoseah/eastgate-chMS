import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if invitation exists and is a system invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: params.id,
        invitationType: "system",
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Can only resend pending invitations" },
        { status: 400 }
      );
    }

    // Extend expiration by 7 days
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Update invitation
    const updatedInvitation = await prisma.invitation.update({
      where: { id: params.id },
      data: { expiresAt: newExpiresAt },
    });

    // TODO: Resend invitation email
    // await sendInvitationEmail(invitation.email, invitation.token, invitation.role);

    return NextResponse.json(updatedInvitation);
  } catch (error: any) {
    console.error("Error resending system invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
