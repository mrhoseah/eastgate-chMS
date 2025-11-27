"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye,
  MousePointerClick,
  Share2,
  Calendar,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationId?: string;
}

const mockAnalytics = {
  overview: {
    totalViews: 1250,
    uniqueViewers: 890,
    avgEngagement: 72,
    shares: 45,
    trend: '+12%',
  },
  byPlatform: [
    { platform: 'Facebook', views: 450, engagement: 68 },
    { platform: 'Instagram', views: 320, engagement: 75 },
    { platform: 'Twitter', views: 280, engagement: 65 },
    { platform: 'Email', views: 200, engagement: 82 },
  ],
  byDate: [
    { date: 'Mon', views: 120 },
    { date: 'Tue', views: 180 },
    { date: 'Wed', views: 150 },
    { date: 'Thu', views: 200 },
    { date: 'Fri', views: 250 },
    { date: 'Sat', views: 180 },
    { date: 'Sun', views: 170 },
  ],
  topContent: [
    { title: 'Sunday Service', views: 450, engagement: 78 },
    { title: 'Sermon Series Intro', views: 320, engagement: 72 },
    { title: 'Event Announcement', views: 280, engagement: 68 },
  ],
};

export function AnalyticsDashboard({ open, onOpenChange, presentationId }: AnalyticsDashboardProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Marketing Analytics
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Track performance across all your marketing channels
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="space-y-6 p-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Total Views</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{mockAnalytics.overview.totalViews.toLocaleString()}</div>
                  <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {mockAnalytics.overview.trend}
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Unique Viewers</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{mockAnalytics.overview.uniqueViewers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">This month</div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Engagement</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{mockAnalytics.overview.avgEngagement}%</div>
                  <div className="text-xs text-gray-500 mt-1">Average rate</div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">Shares</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{mockAnalytics.overview.shares}</div>
                  <div className="text-xs text-gray-500 mt-1">Total shares</div>
                </div>
              </div>

              {/* Platform Performance */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Performance by Platform</h3>
                <div className="space-y-2">
                  {mockAnalytics.byPlatform.map((platform) => (
                    <div key={platform.platform} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{platform.platform}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400">{platform.views} views</span>
                          <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                            {platform.engagement}% engagement
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${platform.engagement}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Trend */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Weekly Views</h3>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-end justify-between h-32 gap-2">
                    {mockAnalytics.byDate.map((day) => {
                      const maxViews = Math.max(...mockAnalytics.byDate.map(d => d.views));
                      const height = (day.views / maxViews) * 100;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                          <div className="relative w-full h-full flex items-end">
                            <div
                              className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
                              style={{ height: `${height}%` }}
                              title={`${day.views} views`}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">Social Media Performance</h3>
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
                {/* Social media analytics would go here */}
              </div>
            </TabsContent>

            <TabsContent value="email" className="p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Email Campaign Performance</h3>
                {/* Email analytics would go here */}
              </div>
            </TabsContent>

            <TabsContent value="content" className="p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Top Performing Content</h3>
                <div className="space-y-3">
                  {mockAnalytics.topContent.map((content, idx) => (
                    <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{content.title}</h4>
                        <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-500/30">
                          {content.engagement}% engagement
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{content.views} views</span>
                        <span>•</span>
                        <span>Last 30 days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

