import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "SUPERADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: applicationId } = await params;
    const body = await req.json();
    const { action, periodDays, isUnlimited, notes, rejectionReason } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the application
    const application = await prisma.sponsorshipApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (action === "reject") {
      // For rejection, we just update the notes
      return NextResponse.json({
        success: true,
        message: "Application rejected",
      });
    }

    // For approval, create a church and sponsorship
    const church = await prisma.church.create({
      data: {
        name: application.churchName,
        denomination: application.denomination,
        email: application.contactEmail,
        phone: application.contactPhone,
        address: application.address,
        city: application.city,
        state: application.state,
        zipCode: application.zipCode,
        country: application.country,
        website: application.website,
        isSponsored: true,
        unlimitedUse: isUnlimited || false,
      },
    });

    // Calculate end date if not unlimited
    let endDate: Date | null = null;
    if (!isUnlimited && periodDays) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(periodDays));
    }

    // Create sponsorship record
    const sponsorship = await prisma.sponsorship.create({
      data: {
        churchId: church.id,
        status: "ACTIVE",
        periodDays: isUnlimited ? null : parseInt(periodDays || "0"),
        isUnlimited: isUnlimited || false,
        startDate: new Date(),
        endDate,
        approvedById: session.user.id,
        reviewedAt: new Date(),
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application approved and church created",
      church: {
        id: church.id,
        name: church.name,
      },
      sponsorship: {
        id: sponsorship.id,
        isUnlimited: sponsorship.isUnlimited,
        endDate: sponsorship.endDate,
      },
    });
  } catch (error: any) {
    console.error("Error reviewing application:", error);
    return NextResponse.json(
      { error: error.message || "Failed to review application" },
      { status: 500 }
    );
  }
}
