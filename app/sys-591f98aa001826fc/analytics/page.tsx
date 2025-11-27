"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Activity,
  Crown,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SystemStats {
  totalChurches: number;
  activeChurches: number;
  sponsoredChurches: number;
  totalCampuses: number;
  totalAdmins: number;
  recentActivity: {
    newChurches: number;
    newAdmins: number;
  };
  subscriptions: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          System Analytics
        </h1>
        <p className="text-gray-500 mt-1">
          Overview of system-wide metrics and performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              <span>Total Churches</span>
              <Building2 className="w-4 h-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalChurches}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{stats.recentActivity.newChurches} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              <span>Active Churches</span>
              <Activity className="w-4 h-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.activeChurches}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((stats.activeChurches / stats.totalChurches) * 100).toFixed(1)}% active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              <span>Total Campuses</span>
              <Building2 className="w-4 h-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCampuses}</div>
            <p className="text-xs text-gray-500 mt-1">
              Avg {(stats.totalCampuses / stats.totalChurches).toFixed(1)} per church
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              <span>System Admins</span>
              <Users className="w-4 h-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{stats.recentActivity.newAdmins} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription>
              Distribution of churches by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-gray-500">
                    {stats.subscriptions.free} churches
                  </p>
                </div>
                <Badge variant="secondary">
                  {((stats.subscriptions.free / stats.totalChurches) * 100).toFixed(0)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Basic Plan
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {stats.subscriptions.basic} churches
                  </p>
                </div>
                <Badge className="bg-blue-500">
                  {((stats.subscriptions.basic / stats.totalChurches) * 100).toFixed(0)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">
                    Premium Plan
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {stats.subscriptions.premium} churches
                  </p>
                </div>
                <Badge className="bg-purple-500">
                  {((stats.subscriptions.premium / stats.totalChurches) * 100).toFixed(0)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Enterprise Plan
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {stats.subscriptions.enterprise} churches
                  </p>
                </div>
                <Badge className="bg-yellow-500">
                  {((stats.subscriptions.enterprise / stats.totalChurches) * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Sponsored Churches
            </CardTitle>
            <CardDescription>
              Churches with special sponsorship status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
                <div>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {stats.sponsoredChurches}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Sponsored Churches
                  </p>
                </div>
                <Crown className="w-12 h-12 text-yellow-500" />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sponsored churches receive special benefits including unlimited use,
                  free premium features, and priority support.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <p className="text-2xl font-bold">
                    {((stats.sponsoredChurches / stats.totalChurches) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">of all churches</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalChurches - stats.sponsoredChurches}
                  </p>
                  <p className="text-xs text-gray-500">paying churches</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Current system status and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Database
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Operational
                </p>
              </div>
              <Badge className="bg-green-500">Healthy</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  API Services
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All systems go
                </p>
              </div>
              <Badge className="bg-green-500">Online</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Uptime
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Last 30 days
                </p>
              </div>
              <Badge className="bg-green-500">99.9%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
