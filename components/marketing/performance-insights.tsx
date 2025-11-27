"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  Users,
  BarChart3,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import { useMarketingStore } from "@/lib/store/marketing-store";
import { Badge } from "@/components/ui/badge";

interface PerformanceInsightsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PerformanceInsights({ open, onOpenChange }: PerformanceInsightsProps) {
  const { getOverallStats, campaigns, emailCampaigns, socialPosts } = useMarketingStore();
  const [insights, setInsights] = useState<Array<{
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
    action?: string;
  }>>([]);
  const isDialog = onOpenChange !== undefined && typeof onOpenChange === 'function';

  useEffect(() => {
    if (open) {
      generateInsights();
    }
  }, [open, campaigns, emailCampaigns, socialPosts]);

  const generateInsights = () => {
    const stats = getOverallStats();
    const newInsights: typeof insights = [];

    // Engagement insights
    if (stats.totalEngagement > 0) {
      const engagementRate = (stats.totalEngagement / stats.totalReach) * 100;
      if (engagementRate > 5) {
        newInsights.push({
          type: 'success',
          title: 'High Engagement Rate',
          description: `Your campaigns are performing well with ${engagementRate.toFixed(1)}% engagement rate.`,
        });
      } else if (engagementRate < 2) {
        newInsights.push({
          type: 'warning',
          title: 'Low Engagement Rate',
          description: `Your engagement rate is ${engagementRate.toFixed(1)}%. Consider A/B testing different content.`,
          action: 'Try A/B Testing',
        });
      }
    }

    // Email performance
    const sentEmails = emailCampaigns.filter(c => c.status === 'sent');
    if (sentEmails.length > 0) {
      const avgOpenRate = sentEmails.reduce((sum, c) => {
        const openRate = c.stats.sent > 0 ? (c.stats.opened / c.stats.sent) * 100 : 0;
        return sum + openRate;
      }, 0) / sentEmails.length;

      if (avgOpenRate > 25) {
        newInsights.push({
          type: 'success',
          title: 'Excellent Email Open Rate',
          description: `Your emails have an average open rate of ${avgOpenRate.toFixed(1)}%, which is above industry average.`,
        });
      } else if (avgOpenRate < 15) {
        newInsights.push({
          type: 'warning',
          title: 'Low Email Open Rate',
          description: `Your email open rate is ${avgOpenRate.toFixed(1)}%. Try improving subject lines.`,
          action: 'Improve Subject Lines',
        });
      }
    }

    // Social media insights
    const publishedPosts = socialPosts.filter(p => p.status === 'published');
    if (publishedPosts.length > 0) {
      const avgEngagement = publishedPosts.reduce((sum, p) => {
        const total = (p.engagement.likes || 0) + (p.engagement.comments || 0) + (p.engagement.shares || 0);
        return sum + total;
      }, 0) / publishedPosts.length;

      if (avgEngagement > 50) {
        newInsights.push({
          type: 'success',
          title: 'Strong Social Engagement',
          description: `Your social posts average ${avgEngagement.toFixed(0)} engagements per post.`,
        });
      }
    }

    // Campaign frequency
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    if (activeCampaigns === 0) {
      newInsights.push({
        type: 'info',
        title: 'No Active Campaigns',
        description: 'You currently have no active campaigns. Consider launching a new campaign to engage your audience.',
        action: 'Create Campaign',
      });
    }

    setInsights(newInsights);
  };

  const getInsightIcon = (type: typeof insights[0]['type']) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Lightbulb className="w-5 h-5 text-blue-400" />;
    }
  };

  const getInsightColor = (type: typeof insights[0]['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-600/10 border-green-500/30';
      case 'warning':
        return 'bg-yellow-600/10 border-yellow-500/30';
      case 'info':
        return 'bg-blue-600/10 border-blue-500/30';
    }
  };

  const stats = getOverallStats();

  const content = (
    <Tabs defaultValue="insights" className="flex-1 flex flex-col overflow-hidden h-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="insights" className="space-y-4 p-2">
              {insights.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No insights available yet</p>
                  <p className="text-xs mt-2">Start running campaigns to get insights</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
                          <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
                          {insight.action && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-gray-700 text-gray-300 text-xs"
                            >
                              {insight.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="p-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Total Reach</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalReach.toLocaleString()}</div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Engagement</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalEngagement.toLocaleString()}</div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Conversions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalConversions.toLocaleString()}</div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">Avg ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.averageROI.toFixed(1)}%</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="p-2">
              <div className="space-y-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Best Practices</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Post consistently on social media (3-5 times per week)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Send email campaigns during peak engagement hours (9-11 AM, 2-4 PM)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Use A/B testing to optimize subject lines and content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Segment your audience for personalized messaging</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
  );

  if (isDialog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Insights
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              AI-powered insights to improve your marketing performance
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance Insights
        </h2>
        <p className="text-sm text-gray-400 mt-1">AI-powered insights to improve your marketing performance</p>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        {content}
      </div>
    </div>
  );
}

