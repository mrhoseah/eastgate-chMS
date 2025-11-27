import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      plan,
      status,
      billingCycle,
      amount,
      currency,
      startDate,
      endDate,
      trialEndDate,
    } = body;

    // Check if subscription exists
    const existing = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        plan: plan || existing.plan,
        status: status || existing.status,
        billingCycle: billingCycle || existing.billingCycle,
        amount: amount !== undefined ? amount.toString() : existing.amount,
        currency: currency || existing.currency,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        trialEndDate: trialEndDate ? new Date(trialEndDate) : existing.trialEndDate,
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
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if subscription exists
    const existing = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Update status to cancelled instead of deleting
    await prisma.subscription.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
