import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RawSetting = {
  key: string;
  value: string;
  type: string;
};

type PaymentMethodConfig = {
  method: "MPESA" | "PAYPAL" | "BANK_TRANSFER";
  label: string;
  currency: string;
  enabled: boolean;
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

export async function GET() {
  try {
    const church = await prisma.church.findFirst({
      where: { isActive: true },
      include: { settings: true },
    });

    if (!church) {
      return NextResponse.json({ methods: [] });
    }

    const settings = church.settings as RawSetting[];
    const mpesa = parseSetting(settings, "mpesa");
    const paypal = parseSetting(settings, "paypal");
    const bank = parseSetting(settings, "bank");

    const mpesaConfigured = Boolean(
      mpesa?.consumerKey &&
        mpesa?.consumerSecret &&
        mpesa?.shortcode &&
        mpesa?.passkey
    );

    const paypalConfigured = Boolean(paypal?.clientId && paypal?.clientSecret);
    const bankConfigured = Boolean(
      bank?.accountName && bank?.accountNumber && bank?.bankName
    );

    const methods: PaymentMethodConfig[] = [
      {
        method: "MPESA",
        label: "M-Pesa",
        currency: mpesa?.currency || "KES",
        enabled: mpesaConfigured,
      },
      {
        method: "PAYPAL",
        label: "PayPal",
        currency: paypal?.currency || "USD",
        enabled: paypalConfigured,
      },
      {
        method: "BANK_TRANSFER",
        label: bank?.label || "Bank Transfer",
        currency: bank?.currency || "KES",
        enabled: bankConfigured,
      },
    ];

    return NextResponse.json({
      methods,
      mpesa: mpesaConfigured
        ? {
            paybillNumber: mpesa?.paybillNumber,
            paybillAccountName: mpesa?.paybillAccountName,
          }
        : null,
      paypal: paypalConfigured
        ? {
            brandName: paypal?.brandName || "",
            currency: paypal?.currency || "USD",
          }
        : null,
      bank: bankConfigured
        ? {
            bankName: bank?.bankName,
            accountName: bank?.accountName,
            accountNumber: bank?.accountNumber,
            branch: bank?.branch,
            swiftCode: bank?.swiftCode,
            currency: bank?.currency || "KES",
            instructions: bank?.instructions,
            contactEmail: bank?.contactEmail,
          }
        : null,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating payment configuration:", error);
    return NextResponse.json({ methods: [] }, { status: 500 });
  }
}
