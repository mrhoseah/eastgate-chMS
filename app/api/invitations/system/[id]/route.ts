import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

    // Update invitation status to cancelled
    await prisma.invitation.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error cancelling system invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
