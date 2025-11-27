import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List prayer requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // Privacy filtering - users can see:
    // - Their own requests
    // - Public requests
    // - Members-only if they're a member
    // - Leaders-only if they're a leader
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      const isLeader = ["ADMIN", "PASTOR", "LEADER"].includes(user.role);
      const isMember = ["MEMBER", "ADMIN", "PASTOR", "LEADER"].includes(user.role);

      where.OR = [
        { authorId: userId }, // Own requests
        { privacy: "PUBLIC" }, // Public requests
        ...(isMember ? [{ privacy: "MEMBERS_ONLY" }] : []),
        ...(isLeader ? [{ privacy: "LEADERS_ONLY" }] : []),
      ];
    }

    const requests = await prisma.prayerRequest.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            prayers: true,
            updates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error fetching prayer requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch prayer requests" },
      { status: 500 }
    );
  }
}

// POST - Create prayer request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const prayerRequest = await prisma.prayerRequest.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || "OTHER",
        privacy: body.privacy || "MEMBERS_ONLY",
        isAnonymous: body.isAnonymous || false,
        authorId: body.isAnonymous ? null : userId,
        status: "PENDING",
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ request: prayerRequest });
  } catch (error: any) {
    console.error("Error creating prayer request:", error);
    return NextResponse.json(
      { error: "Failed to create prayer request" },
      { status: 500 }
    );
  }
}

