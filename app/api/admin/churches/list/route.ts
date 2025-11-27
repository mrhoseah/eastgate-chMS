import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role.toUpperCase();
    if (role !== "SUPERADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const churches = await prisma.church.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        isSponsored: true,
      },
    });

    return NextResponse.json({ churches });
  } catch (error) {
    console.error("Error fetching churches:", error);
    return NextResponse.json({ error: "Failed to load churches" }, { status: 500 });
  }
}