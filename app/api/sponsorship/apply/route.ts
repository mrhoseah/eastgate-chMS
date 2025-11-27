import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, ...applicationData } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Application token is required" }, { status: 400 });
    }

    // Validate required fields
    if (!applicationData.churchName || !applicationData.contactName || !applicationData.contactEmail || !applicationData.reason) {
      return NextResponse.json(
        { error: "Church name, contact name, contact email, and reason are required" },
        { status: 400 }
      );
    }

    // Update the application with submitted data
    const application = await prisma.sponsorshipApplication.update({
      where: { token },
      data: {
        churchName: applicationData.churchName,
        denomination: applicationData.denomination,
        contactName: applicationData.contactName,
        contactEmail: applicationData.contactEmail,
        contactPhone: applicationData.contactPhone,
        address: applicationData.address,
        city: applicationData.city,
        state: applicationData.state,
        country: applicationData.country,
        zipCode: applicationData.zipCode,
        website: applicationData.website,
        memberCount: applicationData.memberCount ? parseInt(applicationData.memberCount) : null,
        reason: applicationData.reason,
        additionalInfo: applicationData.additionalInfo || {},
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sponsorship application submitted successfully. You will be contacted soon.",
      applicationId: application.id,
    });
  } catch (error: any) {
    console.error("Error submitting sponsorship application:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Invalid or expired application token" }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to submit sponsorship application" },
      { status: 500 }
    );
  }
}

// GET endpoint to verify token and get application details
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const application = await prisma.sponsorshipApplication.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        churchName: true,
        submittedAt: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Check if already submitted
    const isSubmitted = !!application.churchName && !!application.submittedAt;

    return NextResponse.json({
      valid: true,
      submitted: isSubmitted,
    });
  } catch (error: any) {
    console.error("Error verifying token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify token" },
      { status: 500 }
    );
  }
}
