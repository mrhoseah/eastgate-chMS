import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PremiumFeature, hasFeatureAccess } from "@/lib/utils/premium-features";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.churchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature") as PremiumFeature;

    // Get church with subscription
    const church = await prisma.church.findUnique({
      where: { id: session.user.churchId },
      include: {
        subscription: true,
      },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // If checking specific feature
    if (feature) {
      const hasAccess = hasFeatureAccess(church.subscription, feature as PremiumFeature);
      return NextResponse.json({
        hasAccess,
        feature,
        subscription: church.subscription,
      });
    }

    // Return all feature access
    const features = Object.values(PremiumFeature);
    const featureAccess: Record<string, boolean> = {};

    features.forEach((f) => {
      featureAccess[f] = hasFeatureAccess(church.subscription, f);
    });

    return NextResponse.json({
      features: featureAccess,
      subscription: church.subscription,
      church: {
        isSponsored: church.isSponsored,
        unlimitedUse: church.unlimitedUse,
      },
    });
  } catch (error) {
    console.error("Error checking feature access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

