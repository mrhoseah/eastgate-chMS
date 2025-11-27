import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch system announcements visible to current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        campus: {
          select: {
            churchId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    // Build where clause based on user role and church
    const whereClause: any = {
      isPublished: true,
      OR: [
        { publishAt: null },
        { publishAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } },
          ],
        },
      ],
    };

    // Filter by target audience
    if (user.role === "SUPERADMIN") {
      // SUPERADMINs see all announcements or those targeted to superadmins
      whereClause.targetAudience = {
        in: ["all", "superadmins"],
      };
    } else if (user.role === "ADMIN") {
      // Church ADMINs see all, church_admins, or specific churches
      whereClause.OR = [
        { targetAudience: "all" },
        { targetAudience: "church_admins" },
        {
          AND: [
            { targetAudience: "specific_churches" },
            { targetChurches: { contains: user.campus?.churchId || "" } },
          ],
        },
      ];
    } else {
      // Regular users only see "all" audience
      whereClause.targetAudience = "all";
    }

    const announcements = await prisma.systemAnnouncement.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reads: {
          where: {
            userId: session.user.id,
          },
          select: {
            readAt: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      take: 50, // Limit to 50 most recent
    });

    // Mark unread announcements
    const announcementsWithReadStatus = announcements.map((announcement) => ({
      ...announcement,
      isRead: announcement.reads.length > 0,
    }));

    return NextResponse.json({ announcements: announcementsWithReadStatus });
  } catch (error: any) {
    console.error("Error fetching system announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST - Mark announcement as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json(
        { error: "Announcement ID is required" },
        { status: 400 }
      );
    }

    await prisma.systemAnnouncementRead.upsert({
      where: {
        systemAnnouncementId_userId: {
          systemAnnouncementId: announcementId,
          userId: session.user.id,
        },
      },
      create: {
        systemAnnouncementId: announcementId,
        userId: session.user.id,
      },
      update: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking announcement as read:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
