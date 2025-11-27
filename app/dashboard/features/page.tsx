"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumBadge } from "@/components/premium/premium-badge";
import { UpgradeDialog } from "@/components/premium/upgrade-dialog";
import {
  getAllFeatures,
  PremiumFeature,
  getFeaturePricing,
} from "@/lib/utils/premium-features";
import {
  Fingerprint,
  BarChart3,
  Palette,
  Code,
  Headphones,
  Building2,
  TrendingUp,
  Sparkles,
  Workflow,
  Plug,
  Users,
  LineChart,
  FileSpreadsheet,
  FileText,
  Paintbrush,
  Shield,
  Download,
  MessageSquare,
  Video,
  Calendar,
  UserCircle,
  Check,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeatureAccess {
  [key: string]: boolean;
}

export default function FeaturesPage() {
  const { toast } = useToast();
  const [features, setFeatures] = useState(getAllFeatures());
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>({});
  const [selectedFeature, setSelectedFeature] = useState<PremiumFeature | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFeatureAccess();
  }, []);

  const checkFeatureAccess = async () => {
    try {
      const response = await fetch("/api/subscription/features");
      if (response.ok) {
        const data = await response.json();
        setFeatureAccess(data.features || {});
      }
    } catch (error) {
      console.error("Error checking feature access:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (feature: PremiumFeature) => {
    setSelectedFeature(feature);
    setShowUpgradeDialog(true);
  };

  const getFeatureIcon = (feature: PremiumFeature) => {
    const icons: Record<PremiumFeature, any> = {
      [PremiumFeature.BIOMETRIC_ATTENDANCE]: Fingerprint,
      [PremiumFeature.ADVANCED_REPORTING]: BarChart3,
      [PremiumFeature.CUSTOM_BRANDING]: Palette,
      [PremiumFeature.API_ACCESS]: Code,
      [PremiumFeature.PRIORITY_SUPPORT]: Headphones,
      [PremiumFeature.MULTI_CAMPUS]: Building2,
      [PremiumFeature.ADVANCED_ANALYTICS]: TrendingUp,
      [PremiumFeature.AI_POWERED_INSIGHTS]: Sparkles,
      [PremiumFeature.AUTOMATED_WORKFLOWS]: Workflow,
      [PremiumFeature.ADVANCED_INTEGRATIONS]: Plug,
      [PremiumFeature.MEMBER_ENGAGEMENT_SCORING]: Users,
      [PremiumFeature.PREDICTIVE_ANALYTICS]: LineChart,
      [PremiumFeature.BULK_OPERATIONS]: FileSpreadsheet,
      [PremiumFeature.CUSTOM_FORMS]: FileText,
      [PremiumFeature.WHITE_LABEL]: Paintbrush,
      [PremiumFeature.ADVANCED_SECURITY]: Shield,
      [PremiumFeature.DATA_EXPORT_IMPORT]: Download,
      [PremiumFeature.SMS_MESSAGING]: MessageSquare,
      [PremiumFeature.VIDEO_CONFERENCING]: Video,
      [PremiumFeature.ADVANCED_SCHEDULING]: Calendar,
      [PremiumFeature.MEMBER_DIRECTORY_PRO]: UserCircle,
    };
    return icons[feature] || Sparkles;
  };

  const getFeatureCategory = (feature: PremiumFeature): string => {
    if ([
      PremiumFeature.ADVANCED_ANALYTICS,
      PremiumFeature.AI_POWERED_INSIGHTS,
      PremiumFeature.PREDICTIVE_ANALYTICS,
      PremiumFeature.ADVANCED_REPORTING,
    ].includes(feature)) {
      return "Analytics & Insights";
    }
    if ([
      PremiumFeature.AUTOMATED_WORKFLOWS,
      PremiumFeature.ADVANCED_INTEGRATIONS,
      PremiumFeature.BULK_OPERATIONS,
    ].includes(feature)) {
      return "Automation & Integration";
    }
    if ([
      PremiumFeature.MEMBER_ENGAGEMENT_SCORING,
      PremiumFeature.MEMBER_DIRECTORY_PRO,
      PremiumFeature.SMS_MESSAGING,
    ].includes(feature)) {
      return "Member Engagement";
    }
    if ([
      PremiumFeature.CUSTOM_FORMS,
      PremiumFeature.ADVANCED_SCHEDULING,
      PremiumFeature.VIDEO_CONFERENCING,
    ].includes(feature)) {
      return "Tools & Utilities";
    }
    if ([
      PremiumFeature.WHITE_LABEL,
      PremiumFeature.CUSTOM_BRANDING,
      PremiumFeature.ADVANCED_SECURITY,
    ].includes(feature)) {
      return "Customization & Security";
    }
    return "Core Features";
  };

  const categories = Array.from(new Set(features.map(f => getFeatureCategory(f.feature))));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
            <Crown className="w-8 h-8 text-yellow-900" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Premium Features
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Unlock powerful features to enhance your church management
            </p>
          </div>
        </div>
      </div>

      {/* Features by Category */}
      <Tabs defaultValue={categories[0]} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 gap-2">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features
                .filter((f) => getFeatureCategory(f.feature) === category)
                .map((feature) => {
                  const Icon = getFeatureIcon(feature.feature);
                  const hasAccess = featureAccess[feature.feature] || false;

                  return (
                    <Card
                      key={feature.feature}
                      className={`relative overflow-hidden transition-all hover:shadow-lg ${
                        hasAccess
                          ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      {hasAccess && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500 text-white">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      )}

                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <PremiumBadge size="sm" />
                        </div>
                        <CardTitle className="text-lg mt-4">{feature.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${feature.monthlyPrice}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            /month
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
                            or ${(feature.yearlyPrice / 12).toFixed(2)}/mo billed yearly
                          </span>
                        </div>

                        {hasAccess ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Feature Active
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleUpgrade(feature.feature)}
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900 font-semibold"
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to Unlock
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Upgrade Dialog */}
      {selectedFeature && (
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          feature={selectedFeature}
        />
      )}
    </div>
  );
}

