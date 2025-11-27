import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        church: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(subscriptions);
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
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
    const {
      churchId,
      plan,
      status,
      billingCycle,
      amount,
      currency,
      startDate,
      endDate,
      trialEndDate,
    } = body;

    // Validate required fields
    if (!churchId || !plan || !status || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if church exists
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // Check if subscription already exists for this church
    const existing = await prisma.subscription.findUnique({
      where: { churchId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Church already has a subscription" },
        { status: 409 }
      );
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        churchId,
        plan,
        status,
        billingCycle: billingCycle || null,
        amount: amount ? amount.toString() : null,
        currency: currency || "USD",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
      },
      include: {
        church: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
