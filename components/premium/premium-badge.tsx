"use client";

import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PremiumBadge({ className = "", size = "sm" }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={`bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 border-yellow-600 font-semibold ${sizeClasses[size]} ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </Badge>
  );
}

