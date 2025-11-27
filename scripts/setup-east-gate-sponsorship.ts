import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient();

async function setupEastGateChapelSponsorship() {
  console.log("Setting up East Gate Chapel with unlimited sponsorship...");

  try {
    // Find East Gate Chapel
    const eastGateChapel = await prisma.church.findFirst({
      where: {
        name: {
          contains: "East Gate Chapel",
          mode: "insensitive",
        },
      },
    });

    if (!eastGateChapel) {
      console.error("East Gate Chapel not found in the database!");
      return;
    }

    console.log(`Found church: ${eastGateChapel.name} (ID: ${eastGateChapel.id})`);

    // Check if sponsorship already exists
    const existingSponsorship = await prisma.sponsorship.findUnique({
      where: {
        churchId: eastGateChapel.id,
      },
    });

    if (existingSponsorship) {
      console.log("Sponsorship already exists for East Gate Chapel");
      console.log("Existing sponsorship:", existingSponsorship);
      return;
    }

    // Find a SUPERADMIN user to act as approver
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPERADMIN",
      },
    });

    if (!superAdmin) {
      console.error("No SUPERADMIN user found to approve sponsorship!");
      return;
    }

    console.log(`Using SUPERADMIN: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.email})`);

    // Create unlimited sponsorship for East Gate Chapel
    const sponsorship = await prisma.sponsorship.create({
      data: {
        churchId: eastGateChapel.id,
        applicationToken: `sp_initial_${Date.now()}`,
        status: "ACTIVE",
        isUnlimited: true,
        periodDays: null,
        startDate: new Date(),
        endDate: null, // Unlimited
        approvedById: superAdmin.id,
        notes: "Initial unlimited sponsorship for East Gate Chapel",
      },
    });

    console.log("✅ Successfully created unlimited sponsorship for East Gate Chapel!");
    console.log("Sponsorship details:", sponsorship);

    // Update the church to mark as sponsored
    await prisma.church.update({
      where: { id: eastGateChapel.id },
      data: {
        isSponsored: true,
        unlimitedUse: true,
      },
    });

    console.log("✅ Updated church record with sponsorship flags");
  } catch (error) {
    console.error("Error setting up sponsorship:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupEastGateChapelSponsorship();
