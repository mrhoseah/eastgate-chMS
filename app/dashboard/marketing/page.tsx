"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, 
  Mail, 
  BarChart3, 
  Workflow, 
  Calendar,
  TrendingUp,
  Users,
  Eye,
  Click,
  DollarSign,
  MessageSquare,
  Settings,
  Plus
} from "lucide-react";
import { IntegrationsPanel } from "@/components/marketing/integrations-panel";
import { SocialMediaPublisher } from "@/components/marketing/social-media-publisher";
import { EmailCampaignBuilder } from "@/components/marketing/email-campaign-builder";
import { AnalyticsDashboard } from "@/components/marketing/analytics-dashboard";
import { AutomationWorkflows } from "@/components/marketing/automation-workflows";
import { EventPromotion } from "@/components/marketing/event-promotion";
import { AudienceSegmentation } from "@/components/marketing/audience-segmentation";
import { ABTesting } from "@/components/marketing/ab-testing";
import { MarketingCalendar } from "@/components/marketing/marketing-calendar";
import { PerformanceInsights } from "@/components/marketing/performance-insights";
import { useMarketingStore } from "@/lib/store/marketing-store";

export default function MarketingPage() {
  const { getOverallStats, campaigns, emailCampaigns, socialPosts } = useMarketingStore();
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSocialPublisher, setShowSocialPublisher] = useState(false);
  const [showEmailCampaign, setShowEmailCampaign] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showEventPromotion, setShowEventPromotion] = useState(false);
  const [showAudienceSegmentation, setShowAudienceSegmentation] = useState(false);
  const [showABTesting, setShowABTesting] = useState(false);
  const [showMarketingCalendar, setShowMarketingCalendar] = useState(false);
  const [showPerformanceInsights, setShowPerformanceInsights] = useState(false);

  const stats = getOverallStats();
  const sentEmails = emailCampaigns.filter(c => c.status === 'sent');
  const avgOpenRate = sentEmails.length > 0 
    ? sentEmails.reduce((sum, c) => {
        const openRate = c.stats.sent > 0 ? (c.stats.opened / c.stats.sent) * 100 : 0;
        return sum + openRate;
      }, 0) / sentEmails.length
    : 0;

  const quickStats = [
    { 
      label: 'Total Reach', 
      value: stats.totalReach > 1000 ? `${(stats.totalReach / 1000).toFixed(1)}K` : stats.totalReach.toString(), 
      change: '+15%', 
      icon: <Users className="w-5 h-5" />, 
      color: 'text-blue-400' 
    },
    { 
      label: 'Total Engagement', 
      value: stats.totalEngagement > 1000 ? `${(stats.totalEngagement / 1000).toFixed(1)}K` : stats.totalEngagement.toString(), 
      change: '+2.1%', 
      icon: <Click className="w-5 h-5" />, 
      color: 'text-green-400' 
    },
    { 
      label: 'Email Open Rate', 
      value: `${avgOpenRate.toFixed(1)}%`, 
      change: '+3.2%', 
      icon: <Mail className="w-5 h-5" />, 
      color: 'text-purple-400' 
    },
    { 
      label: 'Avg ROI', 
      value: `${stats.averageROI.toFixed(1)}%`, 
      change: '+1.5%', 
      icon: <TrendingUp className="w-5 h-5" />, 
      color: 'text-yellow-400' 
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing Hub</h1>
          <p className="text-sm text-gray-400 mt-1">Manage all your marketing campaigns and integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowIntegrations(true)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            Integrations
          </Button>
          <Button
            onClick={() => setShowSocialPublisher(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickStats.map((stat, idx) => (
            <Card key={idx} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-800 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-9 bg-gray-900 border border-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="segments">Audiences</TabsTrigger>
            <TabsTrigger value="testing">A/B Testing</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="overview" className="h-full overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                    <CardDescription className="text-gray-400">
                      Start a new marketing activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => setShowSocialPublisher(true)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Post to Social Media
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => setShowEmailCampaign(true)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Create Email Campaign
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => setShowEventPromotion(true)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Promote Event
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => setShowAutomation(true)}
                    >
                      <Workflow className="w-4 h-4 mr-2" />
                      Create Automation
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-400">
                      Latest marketing activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { type: 'Email', action: 'Weekly Newsletter sent', time: '2 hours ago', status: 'sent' },
                        { type: 'Social', action: 'Posted to Facebook', time: '5 hours ago', status: 'published' },
                        { type: 'Event', action: 'Event promoted', time: '1 day ago', status: 'active' },
                      ].map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                          <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                            {activity.type === 'Email' && <Mail className="w-4 h-4" />}
                            {activity.type === 'Social' && <Share2 className="w-4 h-4" />}
                            {activity.type === 'Event' && <Calendar className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{activity.action}</p>
                            <p className="text-xs text-gray-400">{activity.time}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400">
                            {activity.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Active Campaigns */}
                <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Active Campaigns</CardTitle>
                        <CardDescription className="text-gray-400">
                          Currently running marketing campaigns
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300"
                        onClick={() => setShowAnalytics(true)}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { name: 'Sunday Service Promotion', type: 'Social', reach: '2.5K', engagement: '12%' },
                        { name: 'Weekly Newsletter', type: 'Email', reach: '890', engagement: '24%' },
                        { name: 'Event: Youth Night', type: 'Event', reach: '1.2K', engagement: '18%' },
                      ].map((campaign, idx) => (
                        <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white">{campaign.name}</h3>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Type:</span>
                              <span className="text-gray-300">{campaign.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Reach:</span>
                              <span className="text-white font-medium">{campaign.reach}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Engagement:</span>
                              <span className="text-green-400 font-medium">{campaign.engagement}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">All Campaigns</h2>
                  <Button
                    onClick={() => setShowEmailCampaign(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
                {/* Campaign list would go here */}
              </div>
            </TabsContent>

            <TabsContent value="automation" className="h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Automation Workflows</h2>
                  <Button
                    onClick={() => setShowAutomation(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Workflow
                  </Button>
                </div>
                {/* Automation workflows would go here */}
              </div>
            </TabsContent>

            <TabsContent value="events" className="h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Event Promotions</h2>
                  <Button
                    onClick={() => setShowEventPromotion(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Promote Event
                  </Button>
                </div>
                {/* Event promotions would go here */}
              </div>
            </TabsContent>

            <TabsContent value="segments" className="h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Audience Segments</h2>
                  <Button
                    onClick={() => setShowAudienceSegmentation(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Segment
                  </Button>
                </div>
                {/* Segments list would go here */}
              </div>
            </TabsContent>

            <TabsContent value="testing" className="h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">A/B Tests</h2>
                  <Button
                    onClick={() => setShowABTesting(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Test
                  </Button>
                </div>
                {/* A/B tests list would go here */}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="h-full">
              <MarketingCalendar 
                open={true} 
                onOpenChange={() => {}} 
              />
            </TabsContent>

            <TabsContent value="insights" className="h-full">
              <PerformanceInsights 
                open={true} 
                onOpenChange={() => {}} 
              />
            </TabsContent>

            <TabsContent value="analytics" className="h-full">
              <AnalyticsDashboard 
                open={true} 
                onOpenChange={() => {}} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
      <IntegrationsPanel open={showIntegrations} onOpenChange={setShowIntegrations} />
      <SocialMediaPublisher open={showSocialPublisher} onOpenChange={setShowSocialPublisher} />
      <EmailCampaignBuilder open={showEmailCampaign} onOpenChange={setShowEmailCampaign} />
      <AutomationWorkflows open={showAutomation} onOpenChange={setShowAutomation} />
      <EventPromotion open={showEventPromotion} onOpenChange={setShowEventPromotion} />
      <AudienceSegmentation open={showAudienceSegmentation} onOpenChange={setShowAudienceSegmentation} />
      <ABTesting open={showABTesting} onOpenChange={setShowABTesting} />
      <MarketingCalendar open={showMarketingCalendar} onOpenChange={setShowMarketingCalendar} />
      <PerformanceInsights open={showPerformanceInsights} onOpenChange={setShowPerformanceInsights} />
    </div>
  );
}

