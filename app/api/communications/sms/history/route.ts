import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission = await checkPermission(
      session.user.id,
      "communications",
      "read"
    );

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let churchId = (session.user as any)?.churchId as string | undefined;
    if (!churchId) {
      const activeChurch = await prisma.church.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      churchId = activeChurch?.id;
    }

    if (!churchId) {
      return NextResponse.json(
        { error: "Church context not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";

    // Build where clause with search
    const whereClause: any = { churchId };
    if (search) {
      whereClause.OR = [
        { message: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { sender: { firstName: { contains: search, mode: "insensitive" } } },
        { sender: { lastName: { contains: search, mode: "insensitive" } } },
        { recipient: { firstName: { contains: search, mode: "insensitive" } } },
        { recipient: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get SMS logs with sender and recipient info
    const smsLogs = await prisma.sMSLog.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.sMSLog.count({ where: whereClause });

    // Group by message and timestamp to show bulk sends together
    const groupedMessages = smsLogs.reduce((acc, log) => {
      const key = `${log.senderId}-${log.message.substring(0, 50)}-${Math.floor(log.createdAt.getTime() / 60000)}`;
      if (!acc[key]) {
        acc[key] = {
          id: log.id,
          message: log.message,
          sender: log.sender,
          recipientType: log.recipientType,
          group: log.group,
          recipients: [],
          totalRecipients: 0,
          successCount: 0,
          failedCount: 0,
          createdAt: log.createdAt,
          sentAt: log.sentAt,
        };
      }
      
      acc[key].recipients.push({
        id: log.id,
        phoneNumber: log.phoneNumber,
        recipient: log.recipient,
        status: log.status,
        errorMessage: log.errorMessage,
      });
      acc[key].totalRecipients++;
      
      if (log.status === "SENT" || log.status === "DELIVERED") {
        acc[key].successCount++;
      } else if (log.status === "FAILED") {
        acc[key].failedCount++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const messages = Object.values(groupedMessages);

    return NextResponse.json({
      messages,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching SMS history:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS history" },
      { status: 500 }
    );
  }
}
