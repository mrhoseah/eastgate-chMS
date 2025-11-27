import { prisma } from "./prisma";

export interface ChurchPWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  logo?: string;
  icon192?: string;
  icon512?: string;
}

/**
 * Get church-specific PWA configuration
 */
export async function getChurchPWAConfig(churchId?: string): Promise<ChurchPWAConfig> {
  try {
    // Get the active church (or specific church if ID provided)
    const church = churchId
      ? await prisma.church.findUnique({
          where: { id: churchId },
        })
      : await prisma.church.findFirst({
          where: { isActive: true },
        });

    if (!church) {
      // Default fallback
      return {
        name: "Church Management System",
        shortName: "ChMS",
        description: "Church Management System",
        themeColor: "#1E40AF",
        backgroundColor: "#ffffff",
      };
    }

    // Get theme color from church settings or use default
    const themeSetting = await prisma.churchSetting.findUnique({
      where: {
        churchId_key: {
          churchId: church.id,
          key: "themeColor",
        },
      },
    });

    const themeColor = themeSetting?.value || "#1E40AF";

    // Construct icon paths (assuming icons are stored per church)
    const icon192 = church.logo
      ? `/api/church/${church.id}/icon/192`
      : "/icons/icon-192x192.png";
    const icon512 = church.logo
      ? `/api/church/${church.id}/icon/512`
      : "/icons/icon-512x512.png";

    return {
      name: `${church.name} - Church Management System`,
      shortName: church.name.length > 20 ? church.name.substring(0, 20) : church.name,
      description: `Church Management System for ${church.name}`,
      themeColor,
      backgroundColor: "#ffffff",
      logo: church.logo || undefined,
      icon192,
      icon512,
    };
  } catch (error) {
    console.error("Error getting church PWA config:", error);
    // Return default fallback
    return {
      name: "Church Management System",
      shortName: "ChMS",
      description: "Church Management System",
      themeColor: "#1E40AF",
      backgroundColor: "#ffffff",
    };
  }
}

/**
 * Generate church-specific manifest JSON
 */
export async function generateChurchManifest(churchId?: string): Promise<any> {
  const config = await getChurchPWAConfig(churchId);

  return {
    name: config.name,
    short_name: config.shortName,
    description: config.description,
    start_url: "/",
    display: "standalone",
    background_color: config.backgroundColor,
    theme_color: config.themeColor,
    orientation: "portrait-primary",
    icons: [
      {
        src: config.icon192 ? config.icon192.replace(/\.png$/i, ".svg") : "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: config.icon512 ? config.icon512.replace(/\.png$/i, ".svg") : "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      // Include all standard sizes (prefer SVG files that exist in public/icons)
      {
        src: "/icons/icon-72x72.svg",
        sizes: "72x72",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-96x96.svg",
        sizes: "96x96",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-128x128.svg",
        sizes: "128x128",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-144x144.svg",
        sizes: "144x144",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-152x152.svg",
        sizes: "152x152",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-384x384.svg",
        sizes: "384x384",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
    categories: ["productivity", "business"],
    screenshots: [],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to dashboard",
        url: "/dashboard",
        icons: [
          {
            src: config.icon192 || "/icons/icon-192x192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        description: "View calendar",
        url: "/dashboard/events",
        icons: [
          {
            src: config.icon192 || "/icons/icon-192x192.png",
            sizes: "192x192",
          },
        ],
      },
    ],
  };
}

