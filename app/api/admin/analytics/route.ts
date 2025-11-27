import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - System analytics (SUPERADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get 30 days ago date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel queries for better performance
    const [
      totalChurches,
      activeChurches,
      sponsoredChurches,
      totalCampuses,
      totalAdmins,
      newChurches,
      newAdmins,
      subscriptions,
    ] = await Promise.all([
      prisma.church.count(),
      prisma.church.count({ where: { isActive: true } }),
      prisma.church.count({ where: { isSponsored: true } }),
      prisma.campus.count(),
      prisma.user.count({ where: { role: "SUPERADMIN" } }),
      prisma.church.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.count({
        where: {
          role: "SUPERADMIN",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.subscription.groupBy({
        by: ["plan"],
        _count: true,
      }),
    ]);

    // Format subscription data
    const subscriptionStats = {
      free: 0,
      basic: 0,
      premium: 0,
      enterprise: 0,
    };

    subscriptions.forEach((sub) => {
      const plan = sub.plan.toLowerCase();
      if (plan in subscriptionStats) {
        subscriptionStats[plan as keyof typeof subscriptionStats] = sub._count;
      }
    });

    // Churches without subscriptions are considered free
    const churchesWithSubscriptions = subscriptions.reduce(
      (acc, sub) => acc + sub._count,
      0
    );
    subscriptionStats.free = totalChurches - churchesWithSubscriptions;

    return NextResponse.json({
      totalChurches,
      activeChurches,
      sponsoredChurches,
      totalCampuses,
      totalAdmins,
      recentActivity: {
        newChurches,
        newAdmins,
      },
      subscriptions: subscriptionStats,
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
