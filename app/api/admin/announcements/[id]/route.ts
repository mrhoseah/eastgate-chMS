import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single system announcement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcement = await prisma.systemAnnouncement.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            reads: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Mark as read if not SUPERADMIN (SUPERADMINs don't need read tracking)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPERADMIN") {
      await prisma.systemAnnouncementRead.upsert({
        where: {
          systemAnnouncementId_userId: {
            systemAnnouncementId: params.id,
            userId: session.user.id,
          },
        },
        create: {
          systemAnnouncementId: params.id,
          userId: session.user.id,
        },
        update: {
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({ announcement });
  } catch (error: any) {
    console.error("Error fetching system announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

// PUT - Update system announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN can update system announcements
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      priority,
      targetAudience,
      targetChurches,
      category,
      publishAt,
      expiresAt,
      isPublished,
      isPinned,
    } = body;

    const announcement = await prisma.systemAnnouncement.update({
      where: { id: params.id },
      data: {
        title,
        content,
        priority,
        targetAudience,
        targetChurches,
        category,
        publishAt: publishAt ? new Date(publishAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPublished,
        isPinned,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ announcement });
  } catch (error: any) {
    console.error("Error updating system announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE - Delete system announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN can delete system announcements
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.systemAnnouncement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting system announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
