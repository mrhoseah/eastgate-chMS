import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/casbin";
import { sendBulkSMS } from "@/lib/sms";

// Helper function to replace template variables with member data
function replaceVariables(
  template: string,
  member: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
  }
): string {
  let personalized = template;
  
  // Replace variables
  personalized = personalized.replace(/\{\{firstName\}\}/g, member.firstName);
  personalized = personalized.replace(/\{\{givenName\}\}/g, member.firstName); // givenName is same as firstName
  personalized = personalized.replace(/\{\{lastName\}\}/g, member.lastName);
  personalized = personalized.replace(
    /\{\{fullName\}\}/g,
    `${member.firstName} ${member.lastName}`
  );
  
  // Additional variables
  if (member.middleName) {
    personalized = personalized.replace(/\{\{middleName\}\}/g, member.middleName);
  }
  
  return personalized;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      "communications",
      "create"
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

    const body = await request.json();
    const { message, recipientIds, groupIds, manualNumbers, recipientType, groupTargetType } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 160) {
      return NextResponse.json(
        { error: "Message exceeds 160 characters" },
        { status: 400 }
      );
    }

    // Collect all recipient IDs
    const allRecipientIds = new Set<string>(recipientIds || []);
    
    console.log("[SMS Bulk] Initial recipient IDs:", Array.from(allRecipientIds));
    console.log("[SMS Bulk] Group IDs:", groupIds);
    console.log("[SMS Bulk] Group target type:", groupTargetType);
    
    // Add group members if groups are selected
    if (groupIds && groupIds.length > 0) {
      // Fetch all subgroups recursively if needed
      const getAllSubgroupIds = async (parentIds: string[]): Promise<string[]> => {
        const subgroups = await prisma.smallGroup.findMany({
          where: { parentId: { in: parentIds } },
          select: { id: true },
        });
        const subgroupIds = subgroups.map(sg => sg.id);
        if (subgroupIds.length > 0) {
          const nestedSubgroups = await getAllSubgroupIds(subgroupIds);
          return [...subgroupIds, ...nestedSubgroups];
        }
        return subgroupIds;
      };

      // Determine which groups to target based on groupTargetType
      let targetGroupIds = [...groupIds];
      
      // If targeting parent groups with subgroups, include all descendants
      if (groupTargetType === "parent-with-subgroups") {
        const subgroupIds = await getAllSubgroupIds(groupIds);
        targetGroupIds = [...groupIds, ...subgroupIds];
      }

      // Fetch groups with members
      const groups = await prisma.smallGroup.findMany({
        where: { id: { in: targetGroupIds } },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  middleName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      console.log("[SMS Bulk] Found", groups.length, "groups");
      groups.forEach(g => {
        console.log(`[SMS Bulk] Group "${g.name}": ${g.members.length} members`);
      });

      // Filter members based on groupTargetType
      groups.forEach((group) => {
        group.members.forEach((member) => {
          if (!member.user.phone) return;

          // Apply filtering based on target type
          const shouldInclude = 
            !groupTargetType || 
            groupTargetType === "all-members" ||
            groupTargetType === "parent-with-subgroups" ||
            (groupTargetType === "leaders-only" && member.isLeader) ||
            (groupTargetType === "parent-leaders" && member.isLeader && groupIds.includes(group.id)) ||
            (groupTargetType === "subgroup-leaders" && member.isLeader && !groupIds.includes(group.id));

          if (shouldInclude) {
            allRecipientIds.add(member.user.id);
          }
        });
      });
    }

    console.log("[SMS Bulk] Total recipient IDs after processing groups:", Array.from(allRecipientIds).length);

    // Get all recipients with their data
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: Array.from(allRecipientIds) },
        phone: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
      },
    });

    console.log("[SMS Bulk] Found", recipients.length, "recipients with phone numbers");
    recipients.forEach(r => {
      console.log(`[SMS Bulk] Recipient: ${r.firstName} ${r.lastName}, Phone: ${r.phone}`);
    });

    // Prepare personalized messages
    const messagesToSend = recipients.map((recipient) => ({
      to: recipient.phone!,
      message: replaceVariables(message, recipient),
      recipientId: recipient.id,
    }));

    // Add manual numbers (without personalization)
    if (manualNumbers) {
      const numbers = manualNumbers
        .split(",")
        .map((n: string) => n.trim())
        .filter((n: string) => n.length > 0);
      
      numbers.forEach((number: string) => {
        messagesToSend.push({
          to: number,
          message: message, // No personalization for manual numbers
          recipientId: null,
        });
      });
    }

    console.log("[SMS Bulk] Total messages to send:", messagesToSend.length);

    // Send SMS via Afrika's Talking API using current church's integration settings
    const result = await sendBulkSMS(messagesToSend, churchId);

    // Log each SMS send attempt
    const smsLogData = messagesToSend.map((msg, index) => {
      const sendResult = result.results[index];
      const groupId = groupIds && groupIds.length > 0 ? groupIds[0] : null;
      
      return {
        churchId,
        senderId: session.user.id,
        recipientId: msg.recipientId || null,
        phoneNumber: msg.to,
        message: msg.message,
        status: sendResult?.success ? "SENT" : "FAILED",
        messageId: sendResult?.messageId || null,
        errorMessage: sendResult?.error || null,
        sentAt: sendResult?.success ? new Date() : null,
        recipientType: recipientType || "individuals",
        groupId: groupId,
        metadata: {
          originalMessage: message,
          isPersonalized: msg.recipientId !== null,
          groupTargetType: groupTargetType || null,
        },
      };
    });

    // Bulk create SMS logs
    try {
      await prisma.sMSLog.createMany({
        data: smsLogData,
        skipDuplicates: true,
      });
    } catch (logError) {
      console.error("Failed to log SMS sends:", logError);
      // Don't fail the request if logging fails
    }

    if (result.failed > 0 && result.success === 0) {
      // All failed
      return NextResponse.json(
        { 
          error: `Failed to send SMS messages. ${result.results[0]?.error || "Please check your SMS configuration."}`,
          details: result.results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      total: messagesToSend.length,
      results: result.results,
    });
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { error: "Failed to send SMS messages" },
      { status: 500 }
    );
  }
}

