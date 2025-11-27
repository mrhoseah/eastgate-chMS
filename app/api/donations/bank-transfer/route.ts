import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RawSetting = {
  key: string;
  value: string;
  type: string;
};

function parseSetting(settings: RawSetting[], key: string) {
  const setting = settings.find((entry) => entry.key === key);
  if (!setting) {
    return null;
  }

  if (setting.type === "json") {
    try {
      return JSON.parse(setting.value);
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(setting.value);
  } catch {
    return setting.value;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      category,
      donorName,
      email,
      reference,
      notes,
      groupId,
    } = body;

    const numericAmount = Number(amount);

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    if (email && typeof email === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Please provide a valid email address" },
          { status: 400 }
        );
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: { settings: true },
    });

    if (!church) {
      return NextResponse.json(
        { error: "Church configuration not found" },
        { status: 500 }
      );
    }

    const bank = parseSetting(church.settings as RawSetting[], "bank");
    const bankConfigured = Boolean(
      bank?.accountName && bank?.accountNumber && bank?.bankName
    );

    if (!bankConfigured) {
      return NextResponse.json(
        { error: "Bank transfer is not enabled" },
        { status: 503 }
      );
    }

    let validGroupId: string | null = null;
    if (groupId) {
      const group = await prisma.smallGroup.findUnique({
        where: { id: groupId },
        select: { id: true, groupGivingEnabled: true },
      });

      if (group && group.groupGivingEnabled) {
        if (userId) {
          const membership = await prisma.groupMember.findUnique({
            where: {
              groupId_userId: {
                groupId,
                userId,
              },
            },
          });

          if (membership) {
            validGroupId = groupId;
          }
        } else {
          validGroupId = groupId;
        }
      }
    }

    const donation = await prisma.donation.create({
      data: {
        userId,
        amount: numericAmount,
        category: category || "OFFERING",
        paymentMethod: "BANK_TRANSFER",
        reference: reference || `BANK-${Date.now()}`,
        status: "pending",
        groupId: validGroupId,
        metadata: {
          donorName: donorName || null,
          email: email || null,
          notes: notes || null,
          bankReference: reference || null,
          bankDetails: {
            bankName: bank.bankName,
            accountName: bank.accountName,
            accountNumber: bank.accountNumber,
            branch: bank.branch,
            swiftCode: bank.swiftCode,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      message: "Bank transfer logged. Please complete the transfer using the provided details.",
      bank: {
        bankName: bank.bankName,
        accountName: bank.accountName,
        accountNumber: bank.accountNumber,
        branch: bank.branch,
        swiftCode: bank.swiftCode,
        instructions: bank.instructions,
        contactEmail: bank.contactEmail,
      },
    });
  } catch (error) {
    console.error("Error logging bank transfer:", error);
    return NextResponse.json(
      { error: "Failed to log bank transfer" },
      { status: 500 }
    );
  }
}
