/**
 * Script to set up East Gate Chapel as a sponsored account
 * Run with: npx tsx scripts/setup-sponsored-church.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupSponsoredChurch() {
  try {
    console.log("Setting up East Gate Chapel as sponsored account...");

    // Find or create East Gate Chapel
    let church = await prisma.church.findFirst({
      where: {
        name: {
          contains: "East Gate",
          mode: "insensitive",
        },
      },
    });

    if (!church) {
      // Create East Gate Chapel if it doesn't exist
      church = await prisma.church.create({
        data: {
          name: "East Gate Chapel",
          isActive: true,
          isSponsored: true,
          unlimitedUse: true,
          timezone: "UTC",
          language: "en",
          currency: "USD",
        },
      });
      console.log("✓ Created East Gate Chapel");
    } else {
      // Update existing church to be sponsored
      church = await prisma.church.update({
        where: { id: church.id },
        data: {
          isSponsored: true,
          unlimitedUse: true,
        },
      });
      console.log("✓ Updated East Gate Chapel to be sponsored");
    }

    console.log(`\n✓ East Gate Chapel setup complete!`);
    console.log(`  Church ID: ${church.id}`);
    console.log(`  Name: ${church.name}`);
    console.log(`  Sponsored: ${church.isSponsored}`);
    console.log(`  Unlimited Use: ${church.unlimitedUse}`);
  } catch (error) {
    console.error("Error setting up sponsored church:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupSponsoredChurch();

