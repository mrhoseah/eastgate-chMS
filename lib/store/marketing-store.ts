import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'event' | 'automation';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  createdAt: Date;
  scheduledFor?: Date;
  sentAt?: Date;
  recipients: number;
  opens?: number;
  clicks?: number;
  conversions?: number;
  metadata?: Record<string, any>;
}

export interface SocialMediaPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube';
  content: string;
  imageUrl?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: Date;
  publishedAt?: Date;
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  templateId?: string;
  recipientGroup: 'all' | 'members' | 'visitors' | 'segment';
  segmentId?: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: Date;
  sentAt?: Date;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  memberCount: number;
  createdAt: Date;
}

export interface ABTest {
  id: string;
  name: string;
  type: 'email' | 'social' | 'landing';
  variantA: { name: string; performance: number; participants: number };
  variantB: { name: string; performance: number; participants: number };
  status: 'running' | 'completed' | 'paused';
  winner?: 'A' | 'B';
  confidence: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface MarketingIntegration {
  id: string;
  name: string;
  type: 'social' | 'email' | 'analytics' | 'advertising' | 'church';
  status: 'connected' | 'disconnected' | 'pending';
  connectedAt?: Date;
  settings: Record<string, any>;
}

interface MarketingState {
  campaigns: MarketingCampaign[];
  socialPosts: SocialMediaPost[];
  emailCampaigns: EmailCampaign[];
  segments: AudienceSegment[];
  abTests: ABTest[];
  integrations: MarketingIntegration[];
  
  // Actions
  addCampaign: (campaign: Omit<MarketingCampaign, 'id' | 'createdAt'>) => string;
  updateCampaign: (id: string, updates: Partial<MarketingCampaign>) => void;
  deleteCampaign: (id: string) => void;
  
  addSocialPost: (post: Omit<SocialMediaPost, 'id' | 'engagement'>) => string;
  updateSocialPost: (id: string, updates: Partial<SocialMediaPost>) => void;
  deleteSocialPost: (id: string) => void;
  publishSocialPost: (id: string) => Promise<void>;
  
  addEmailCampaign: (campaign: Omit<EmailCampaign, 'id' | 'stats'>) => string;
  updateEmailCampaign: (id: string, updates: Partial<EmailCampaign>) => void;
  sendEmailCampaign: (id: string) => Promise<void>;
  
  addSegment: (segment: Omit<AudienceSegment, 'id' | 'createdAt' | 'memberCount'>) => string;
  updateSegment: (id: string, updates: Partial<AudienceSegment>) => void;
  deleteSegment: (id: string) => void;
  calculateSegmentSize: (segmentId: string) => Promise<number>;
  
  addABTest: (test: Omit<ABTest, 'id' | 'createdAt' | 'confidence'>) => string;
  updateABTest: (id: string, updates: Partial<ABTest>) => void;
  endABTest: (id: string) => void;
  
  addIntegration: (integration: Omit<MarketingIntegration, 'id'>) => string;
  updateIntegration: (id: string, updates: Partial<MarketingIntegration>) => void;
  removeIntegration: (id: string) => void;
  connectIntegration: (id: string, credentials: Record<string, any>) => Promise<void>;
  
  // Analytics
  getCampaignStats: (campaignId: string) => {
    reach: number;
    engagement: number;
    conversion: number;
    roi: number;
  };
  getOverallStats: () => {
    totalReach: number;
    totalEngagement: number;
    totalConversions: number;
    averageROI: number;
  };
}

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      socialPosts: [],
      emailCampaigns: [],
      segments: [],
      abTests: [],
      integrations: [],

      addCampaign: (campaign) => {
        const id = `campaign_${Date.now()}`;
        const newCampaign: MarketingCampaign = {
          ...campaign,
          id,
          createdAt: new Date(),
        };
        set((state) => ({
          campaigns: [...state.campaigns, newCampaign],
        }));
        return id;
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
      },

      addSocialPost: (post) => {
        const id = `post_${Date.now()}`;
        const newPost: SocialMediaPost = {
          ...post,
          id,
          engagement: {},
        };
        set((state) => ({
          socialPosts: [...state.socialPosts, newPost],
        }));
        return id;
      },

      updateSocialPost: (id, updates) => {
        set((state) => ({
          socialPosts: state.socialPosts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteSocialPost: (id) => {
        set((state) => ({
          socialPosts: state.socialPosts.filter((p) => p.id !== id),
        }));
      },

      publishSocialPost: async (id) => {
        // In production, this would call the actual social media API
        set((state) => ({
          socialPosts: state.socialPosts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'published',
                  publishedAt: new Date(),
                }
              : p
          ),
        }));
      },

      addEmailCampaign: (campaign) => {
        const id = `email_${Date.now()}`;
        const newCampaign: EmailCampaign = {
          ...campaign,
          id,
          stats: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
          },
        };
        set((state) => ({
          emailCampaigns: [...state.emailCampaigns, newCampaign],
        }));
        return id;
      },

      updateEmailCampaign: (id, updates) => {
        set((state) => ({
          emailCampaigns: state.emailCampaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      sendEmailCampaign: async (id) => {
        // In production, this would call the email service API
        const campaign = get().emailCampaigns.find((c) => c.id === id);
        if (!campaign) return;

        // Simulate sending
        const sent = campaign.recipientGroup === 'all' ? 1000 : 500;
        set((state) => ({
          emailCampaigns: state.emailCampaigns.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'sent',
                  sentAt: new Date(),
                  stats: {
                    ...c.stats,
                    sent,
                    delivered: Math.floor(sent * 0.95),
                  },
                }
              : c
          ),
        }));
      },

      addSegment: (segment) => {
        const id = `segment_${Date.now()}`;
        const newSegment: AudienceSegment = {
          ...segment,
          id,
          createdAt: new Date(),
          memberCount: 0,
        };
        set((state) => ({
          segments: [...state.segments, newSegment],
        }));
        // Calculate size asynchronously
        get().calculateSegmentSize(id);
        return id;
      },

      updateSegment: (id, updates) => {
        set((state) => ({
          segments: state.segments.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
        // Recalculate size if criteria changed
        if (updates.criteria) {
          get().calculateSegmentSize(id);
        }
      },

      deleteSegment: (id) => {
        set((state) => ({
          segments: state.segments.filter((s) => s.id !== id),
        }));
      },

      calculateSegmentSize: async (segmentId) => {
        // In production, this would query the database
        const segment = get().segments.find((s) => s.id === segmentId);
        if (!segment) return;

        // Mock calculation
        const count = Math.floor(Math.random() * 500) + 50;
        set((state) => ({
          segments: state.segments.map((s) =>
            s.id === segmentId ? { ...s, memberCount: count } : s
          ),
        }));
      },

      addABTest: (test) => {
        const id = `test_${Date.now()}`;
        const newTest: ABTest = {
          ...test,
          id,
          createdAt: new Date(),
          confidence: 0,
        };
        set((state) => ({
          abTests: [...state.abTests, newTest],
        }));
        return id;
      },

      updateABTest: (id, updates) => {
        set((state) => ({
          abTests: state.abTests.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      endABTest: (id) => {
        const test = get().abTests.find((t) => t.id === id);
        if (!test) return;

        const winner = test.variantA.performance > test.variantB.performance ? 'A' : 'B';
        const confidence = Math.min(95, Math.max(60, Math.abs(test.variantA.performance - test.variantB.performance) * 2));

        set((state) => ({
          abTests: state.abTests.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: 'completed',
                  winner,
                  confidence,
                  completedAt: new Date(),
                }
              : t
          ),
        }));
      },

      addIntegration: (integration) => {
        const id = `integration_${Date.now()}`;
        const newIntegration: MarketingIntegration = {
          ...integration,
          id,
        };
        set((state) => ({
          integrations: [...state.integrations, newIntegration],
        }));
        return id;
      },

      updateIntegration: (id, updates) => {
        set((state) => ({
          integrations: state.integrations.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        }));
      },

      removeIntegration: (id) => {
        set((state) => ({
          integrations: state.integrations.filter((i) => i.id !== id),
        }));
      },

      connectIntegration: async (id, credentials) => {
        // In production, this would validate and store credentials securely
        set((state) => ({
          integrations: state.integrations.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: 'connected',
                  connectedAt: new Date(),
                  settings: { ...i.settings, ...credentials },
                }
              : i
          ),
        }));
      },

      getCampaignStats: (campaignId) => {
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        if (!campaign) {
          return { reach: 0, engagement: 0, conversion: 0, roi: 0 };
        }

        const reach = campaign.recipients || 0;
        const engagement = campaign.opens
          ? (campaign.clicks || 0) / campaign.opens
          : 0;
        const conversion = campaign.conversions || 0;
        const roi = conversion > 0 ? (conversion * 100) / reach : 0;

        return { reach, engagement, conversion, roi };
      },

      getOverallStats: () => {
        const campaigns = get().campaigns.filter((c) => c.status === 'active' || c.status === 'completed');
        const totalReach = campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0);
        const totalEngagement = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
        const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
        const averageROI = totalReach > 0 ? (totalConversions * 100) / totalReach : 0;

        return {
          totalReach,
          totalEngagement,
          totalConversions,
          averageROI,
        };
      },
    }),
    {
      name: 'marketing-storage',
    }
  )
);

