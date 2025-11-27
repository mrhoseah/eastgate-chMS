/**
 * Premium Features Utility
 * 
 * Checks if a church has access to premium features
 */

export enum PremiumFeature {
  BIOMETRIC_ATTENDANCE = "BIOMETRIC_ATTENDANCE",
  ADVANCED_REPORTING = "ADVANCED_REPORTING",
  CUSTOM_BRANDING = "CUSTOM_BRANDING",
  API_ACCESS = "API_ACCESS",
  PRIORITY_SUPPORT = "PRIORITY_SUPPORT",
  MULTI_CAMPUS = "MULTI_CAMPUS",
  ADVANCED_ANALYTICS = "ADVANCED_ANALYTICS",
  AI_POWERED_INSIGHTS = "AI_POWERED_INSIGHTS",
  AUTOMATED_WORKFLOWS = "AUTOMATED_WORKFLOWS",
  ADVANCED_INTEGRATIONS = "ADVANCED_INTEGRATIONS",
  MEMBER_ENGAGEMENT_SCORING = "MEMBER_ENGAGEMENT_SCORING",
  PREDICTIVE_ANALYTICS = "PREDICTIVE_ANALYTICS",
  BULK_OPERATIONS = "BULK_OPERATIONS",
  CUSTOM_FORMS = "CUSTOM_FORMS",
  WHITE_LABEL = "WHITE_LABEL",
  ADVANCED_SECURITY = "ADVANCED_SECURITY",
  DATA_EXPORT_IMPORT = "DATA_EXPORT_IMPORT",
  SMS_MESSAGING = "SMS_MESSAGING",
  VIDEO_CONFERENCING = "VIDEO_CONFERENCING",
  ADVANCED_SCHEDULING = "ADVANCED_SCHEDULING",
  MEMBER_DIRECTORY_PRO = "MEMBER_DIRECTORY_PRO",
}

export enum SubscriptionPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
}

interface Subscription {
  plan: SubscriptionPlan;
  features: PremiumFeature[];
  status: string;
  endDate?: Date | null;
  trialEndDate?: Date | null;
  church?: {
    isSponsored?: boolean;
    unlimitedUse?: boolean;
  };
}

/**
 * Check if a subscription has access to a specific feature
 */
export function hasFeatureAccess(
  subscription: Subscription | null | undefined,
  feature: PremiumFeature
): boolean {
  // Sponsored/unlimited accounts have all features
  if (subscription?.church?.isSponsored || subscription?.church?.unlimitedUse) {
    return true;
  }

  // No subscription = no premium features
  if (!subscription) {
    return false;
  }

  // Check if subscription is active
  if (subscription.status !== "active") {
    return false;
  }

  // Check if subscription has expired
  if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
    return false;
  }

  // Check if trial has expired
  if (subscription.trialEndDate && new Date(subscription.trialEndDate) < new Date()) {
    return false;
  }

  // Check if feature is included in subscription
  return subscription.features.includes(feature);
}

/**
 * Get feature pricing information
 */
export function getFeaturePricing(feature: PremiumFeature): {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
} {
  const pricing: Record<PremiumFeature, any> = {
    [PremiumFeature.BIOMETRIC_ATTENDANCE]: {
      name: "Biometric Attendance",
      description: "Fingerprint and face recognition attendance tracking with device integration",
      monthlyPrice: 29.99,
      yearlyPrice: 299.99, // ~2 months free
      currency: "USD",
    },
    [PremiumFeature.ADVANCED_REPORTING]: {
      name: "Advanced Reporting",
      description: "Custom reports, analytics, and data exports",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      currency: "USD",
    },
    [PremiumFeature.CUSTOM_BRANDING]: {
      name: "Custom Branding",
      description: "Remove branding and add your church logo",
      monthlyPrice: 14.99,
      yearlyPrice: 149.99,
      currency: "USD",
    },
    [PremiumFeature.API_ACCESS]: {
      name: "API Access",
      description: "RESTful API access for integrations",
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      currency: "USD",
    },
    [PremiumFeature.PRIORITY_SUPPORT]: {
      name: "Priority Support",
      description: "24/7 priority email and chat support",
      monthlyPrice: 24.99,
      yearlyPrice: 249.99,
      currency: "USD",
    },
    [PremiumFeature.MULTI_CAMPUS]: {
      name: "Multi-Campus",
      description: "Manage multiple campuses and locations",
      monthlyPrice: 34.99,
      yearlyPrice: 349.99,
      currency: "USD",
    },
    [PremiumFeature.ADVANCED_ANALYTICS]: {
      name: "Advanced Analytics",
      description: "Deep insights and predictive analytics",
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      currency: "USD",
    },
    [PremiumFeature.AI_POWERED_INSIGHTS]: {
      name: "AI-Powered Insights",
      description: "AI-driven member insights, engagement predictions, and smart recommendations",
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      currency: "USD",
    },
    [PremiumFeature.AUTOMATED_WORKFLOWS]: {
      name: "Automated Workflows",
      description: "Create custom automation workflows for follow-ups, reminders, and processes",
      monthlyPrice: 34.99,
      yearlyPrice: 349.99,
      currency: "USD",
    },
    [PremiumFeature.ADVANCED_INTEGRATIONS]: {
      name: "Advanced Integrations",
      description: "Connect with QuickBooks, Mailchimp, Salesforce, Zapier, and 50+ apps",
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      currency: "USD",
    },
    [PremiumFeature.MEMBER_ENGAGEMENT_SCORING]: {
      name: "Member Engagement Scoring",
      description: "AI-powered engagement scores to identify at-risk members and opportunities",
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      currency: "USD",
    },
    [PremiumFeature.PREDICTIVE_ANALYTICS]: {
      name: "Predictive Analytics",
      description: "Forecast attendance, giving trends, and member behavior patterns",
      monthlyPrice: 44.99,
      yearlyPrice: 449.99,
      currency: "USD",
    },
    [PremiumFeature.BULK_OPERATIONS]: {
      name: "Bulk Operations",
      description: "Perform bulk actions on members, groups, events, and data management",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      currency: "USD",
    },
    [PremiumFeature.CUSTOM_FORMS]: {
      name: "Custom Forms Builder",
      description: "Build custom registration forms, surveys, and data collection forms",
      monthlyPrice: 24.99,
      yearlyPrice: 249.99,
      currency: "USD",
    },
    [PremiumFeature.WHITE_LABEL]: {
      name: "White Label",
      description: "Remove all branding, add your logo, and customize the entire interface",
      monthlyPrice: 79.99,
      yearlyPrice: 799.99,
      currency: "USD",
    },
    [PremiumFeature.ADVANCED_SECURITY]: {
      name: "Advanced Security",
      description: "2FA, SSO, audit logs, advanced permissions, and compliance features",
      monthlyPrice: 34.99,
      yearlyPrice: 349.99,
      currency: "USD",
    },
    [PremiumFeature.DATA_EXPORT_IMPORT]: {
      name: "Data Export/Import",
      description: "Advanced data export, import from other systems, and migration tools",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      currency: "USD",
    },
    [PremiumFeature.SMS_MESSAGING]: {
      name: "SMS Messaging",
      description: "Send bulk SMS messages, automated SMS notifications, and two-way messaging",
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      currency: "USD",
    },
    [PremiumFeature.VIDEO_CONFERENCING]: {
      name: "Video Conferencing",
      description: "Integrated video meetings, webinars, and virtual events",
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      currency: "USD",
    },
    [PremiumFeature.ADVANCED_SCHEDULING]: {
      name: "Advanced Scheduling",
      description: "AI-powered volunteer scheduling, conflict detection, and auto-assignment",
      monthlyPrice: 24.99,
      yearlyPrice: 249.99,
      currency: "USD",
    },
    [PremiumFeature.MEMBER_DIRECTORY_PRO]: {
      name: "Member Directory Pro",
      description: "Advanced member directory with photos, search, filters, and networking",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      currency: "USD",
    },
  };

  return pricing[feature] || {
    name: "Premium Feature",
    description: "Additional premium feature",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
  };
}

/**
 * Get all available features with pricing
 */
export function getAllFeatures(): Array<{
  feature: PremiumFeature;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
}> {
  return Object.values(PremiumFeature).map((feature) => ({
    feature,
    ...getFeaturePricing(feature),
  }));
}

