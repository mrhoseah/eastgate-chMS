"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  MessageSquare,
  Share2,
  BarChart3,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Settings,
  Plus,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMarketingStore } from "@/lib/store/marketing-store";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'email' | 'analytics' | 'advertising' | 'church';
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'pending';
  connectedAt?: Date;
  settings?: Record<string, any>;
}

const availableIntegrations: Integration[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Share events and announcements on Facebook',
    category: 'social',
    icon: <Facebook className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Post images and stories to Instagram',
    category: 'social',
    icon: <Instagram className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Tweet announcements and updates',
    category: 'social',
    icon: <Twitter className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Upload and manage sermon videos',
    category: 'social',
    icon: <Youtube className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and newsletters',
    category: 'email',
    icon: <Mail className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional and marketing emails',
    category: 'email',
    icon: <Mail className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track website and presentation analytics',
    category: 'analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'facebook-ads',
    name: 'Facebook Ads',
    description: 'Create and manage Facebook ad campaigns',
    category: 'advertising',
    icon: <Facebook className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Manage Google advertising campaigns',
    category: 'advertising',
    icon: <BarChart3 className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'church-center',
    name: 'Church Center',
    description: 'Integrate with Planning Center',
    category: 'church',
    icon: <Settings className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'breeze',
    name: 'Breeze ChMS',
    description: 'Connect with Breeze church management',
    category: 'church',
    icon: <Settings className="w-5 h-5" />,
    status: 'disconnected',
  },
];

interface IntegrationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationsPanel({ open, onOpenChange }: IntegrationsPanelProps) {
  const { toast } = useToast();
  const { integrations, addIntegration, updateIntegration, removeIntegration, connectIntegration } = useMarketingStore();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  
  // Initialize integrations from store or defaults
  const [localIntegrations, setLocalIntegrations] = useState<Integration[]>(() => {
    if (integrations.length > 0) {
      return availableIntegrations.map(ai => {
        const stored = integrations.find(i => i.name.toLowerCase() === ai.name.toLowerCase());
        return stored ? {
          ...ai,
          status: stored.status as 'connected' | 'disconnected' | 'pending',
          connectedAt: stored.connectedAt,
        } : ai;
      });
    }
    return availableIntegrations;
  });

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
  };

  const handleSaveConnection = async () => {
    if (!selectedIntegration || !apiKey || !apiSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please provide API key and secret",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if integration exists in store
      const existing = integrations.find(i => 
        i.name.toLowerCase() === selectedIntegration.name.toLowerCase()
      );

      if (existing) {
        await connectIntegration(existing.id, { apiKey, apiSecret });
        updateIntegration(existing.id, {
          status: 'connected',
          connectedAt: new Date(),
          settings: { ...existing.settings, apiKey, apiSecret },
        });
      } else {
        const id = addIntegration({
          name: selectedIntegration.name,
          type: selectedIntegration.category as any,
          status: 'connected',
          connectedAt: new Date(),
          settings: { apiKey, apiSecret },
        });
      }

      // Update local state
      setLocalIntegrations(localIntegrations.map(int => 
        int.id === selectedIntegration.id 
          ? { ...int, status: 'connected' as const, connectedAt: new Date() }
          : int
      ));

      toast({
        title: "Integration Connected",
        description: `${selectedIntegration.name} has been successfully connected`,
      });

      setSelectedIntegration(null);
      setApiKey("");
      setApiSecret("");
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect integration. Please check your credentials.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = (integration: Integration) => {
    const stored = integrations.find(i => 
      i.name.toLowerCase() === integration.name.toLowerCase()
    );
    
    if (stored) {
      removeIntegration(stored.id);
    }

    setLocalIntegrations(localIntegrations.map(int => 
      int.id === integration.id 
        ? { ...int, status: 'disconnected' as const, connectedAt: undefined }
        : int
    ));

    toast({
      title: "Integration Disconnected",
      description: `${integration.name} has been disconnected`,
    });
  };

  const connectedCount = localIntegrations.filter(i => i.status === 'connected').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Marketing Integrations
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect with social media, email marketing, analytics, and church tools
            {connectedCount > 0 && (
              <Badge variant="outline" className="ml-2 bg-green-600/20 text-green-400 border-green-500/30">
                {connectedCount} Connected
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="church">Church Tools</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden flex gap-4 mt-4">
            {/* Integrations List */}
            <ScrollArea className="flex-1 border border-gray-700 rounded-lg">
              <div className="p-4 space-y-3">
                {localIntegrations
                  .filter(int => {
                    if (selectedIntegration) return true;
                    return true; // Show all for now, can filter by tab
                  })
                  .map((integration) => (
                    <div
                      key={integration.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedIntegration?.id === integration.id
                          ? 'border-blue-500 bg-blue-600/10'
                          : integration.status === 'connected'
                          ? 'border-green-500/50 bg-green-600/5'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                      onClick={() => handleConnect(integration)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          integration.status === 'connected' 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {integration.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                            {integration.status === 'connected' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{integration.description}</p>
                          {integration.status === 'connected' && integration.connectedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Connected {integration.connectedAt.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {integration.status === 'connected' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnect(integration);
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-600/20 text-xs h-7"
                            >
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnect(integration);
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 text-xs h-7"
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            {/* Connection Settings */}
            {selectedIntegration && (
              <div className="w-80 border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                    {selectedIntegration.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{selectedIntegration.name}</h3>
                    <p className="text-xs text-gray-400">Connection Settings</p>
                  </div>
                </div>

                {selectedIntegration.status === 'connected' ? (
                  <div className="space-y-4">
                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Connected</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        This integration is active and ready to use.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(selectedIntegration)}
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-600/20"
                    >
                      Disconnect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-700 text-gray-300"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Settings
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">API Key</Label>
                      <Input
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter API key"
                        className="bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">API Secret</Label>
                      <Input
                        type="password"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="Enter API secret"
                        className="bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleSaveConnection}
                      disabled={!apiKey || !apiSecret}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Connect Integration
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-700 text-gray-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get API Credentials
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

