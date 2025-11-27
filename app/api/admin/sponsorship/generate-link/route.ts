import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPERADMIN and ADMIN can generate sponsorship links
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "SUPERADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only admins and superadmins can generate sponsorship links" },
        { status: 403 }
      );
    }

    const { notes } = await req.json();

    // Generate a unique token for the application
    const token = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Create the sponsorship application token in the database
    const application = await prisma.sponsorshipApplication.create({
      data: {
        token,
        churchName: "",
        contactName: "",
        contactEmail: "",
        reason: "",
      },
    });

    // Generate the full application URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const applicationUrl = `${baseUrl}/apply-sponsorship?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      applicationUrl,
      message: "Sponsorship application link generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating sponsorship link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate sponsorship link" },
      { status: 500 }
    );
  }
}
