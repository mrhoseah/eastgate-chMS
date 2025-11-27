"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { PremiumFeature, getFeaturePricing, getAllFeatures } from "@/lib/utils/premium-features";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: PremiumFeature;
  onUpgrade?: () => void;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  feature,
  onUpgrade,
}: UpgradeDialogProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const pricing = getFeaturePricing(feature);

  const handleUpgrade = () => {
    // TODO: Integrate with payment gateway
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default: open contact/sales page
      window.open("mailto:sales@shepherd.com?subject=Upgrade Request - Biometric Attendance", "_blank");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-900" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Upgrade to Premium</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Unlock {pricing.name} and more powerful features
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Feature Description */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {pricing.name}
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{pricing.description}</p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-500 text-white text-xs">Save 17%</Badge>
            </button>
          </div>

          {/* Pricing */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                ${billingCycle === "monthly" ? pricing.monthlyPrice : pricing.yearlyPrice}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                /{billingCycle === "monthly" ? "month" : "year"}
              </span>
            </div>
            {billingCycle === "yearly" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ${(pricing.yearlyPrice / 12).toFixed(2)} per month (billed annually)
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              What's included:
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{pricing.name} feature access</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Priority customer support</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Regular feature updates</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Cancel anytime</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900 font-semibold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Questions? Contact us at{" "}
            <a
              href="mailto:support@shepherd.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              support@shepherd.com
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

