import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN can delete system admins
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if target is a system admin
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "User not found or not a system admin" },
        { status: 404 }
      );
    }

    // Delete the system admin
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting system admin:", error);
    return NextResponse.json(
      { error: "Failed to delete system admin" },
      { status: 500 }
    );
  }
}
