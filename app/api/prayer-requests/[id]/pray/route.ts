import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Commit to pray for a request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    // Check if already committed
    const existing = await prisma.prayer.findUnique({
      where: {
        prayerRequestId_userId: {
          prayerRequestId: id,
          userId: userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already committed to pray" },
        { status: 400 }
      );
    }

    // Create prayer commitment
    await prisma.prayer.create({
      data: {
        prayerRequestId: id,
        userId: userId,
      },
    });

    // Update request status to ACTIVE if it was PENDING
    await prisma.prayerRequest.update({
      where: { id },
      data: {
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error committing to prayer:", error);
    return NextResponse.json(
      { error: "Failed to commit to prayer" },
      { status: 500 }
    );
  }
}

