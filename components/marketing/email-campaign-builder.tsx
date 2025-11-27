"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Mail, 
  Users, 
  Send, 
  Calendar,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMarketingStore } from "@/lib/store/marketing-store";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent';
  recipients: number;
  sentAt?: Date;
  scheduledFor?: Date;
}

interface EmailCampaignBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailTemplates = [
  {
    id: 'weekly-newsletter',
    name: 'Weekly Newsletter',
    subject: 'This Week at [Church Name]',
    content: 'Weekly updates, announcements, and upcoming events...',
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    subject: 'You\'re Invited: [Event Name]',
    content: 'Join us for an exciting event...',
  },
  {
    id: 'sermon-series',
    name: 'Sermon Series Announcement',
    subject: 'New Sermon Series Starting',
    content: 'We\'re excited to announce our new sermon series...',
  },
  {
    id: 'donation-appeal',
    name: 'Donation Appeal',
    subject: 'Support Our Mission',
    content: 'Your generous support helps us...',
  },
];

export function EmailCampaignBuilder({ open, onOpenChange }: EmailCampaignBuilderProps) {
  const { toast } = useToast();
  const { emailCampaigns, addEmailCampaign, sendEmailCampaign } = useMarketingStore();
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [recipientGroup, setRecipientGroup] = useState<'all' | 'members' | 'visitors' | 'segment'>('all');
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const handleUseTemplate = (template: typeof emailTemplates[0]) => {
    setSelectedTemplate(template.id);
    setSubject(template.subject);
    setContent(template.content);
  };

  const handleSaveDraft = () => {
    if (!campaignName || !subject || !content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addEmailCampaign({
      name: campaignName,
      subject,
      content,
      templateId: selectedTemplate || undefined,
      recipientGroup,
      status: 'draft',
    });

    toast({
      title: "Draft Saved",
      description: "Campaign saved as draft",
    });

    // Reset form
    setCampaignName("");
    setSubject("");
    setContent("");
    setSelectedTemplate(null);
  };

  const handleSchedule = () => {
    if (!campaignName || !subject || !content || !scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const campaignId = addEmailCampaign({
      name: campaignName,
      subject,
      content,
      templateId: selectedTemplate || undefined,
      recipientGroup,
      status: 'scheduled',
      scheduledFor: new Date(`${scheduledDate}T${scheduledTime}`),
    });

    toast({
      title: "Campaign Scheduled",
      description: `Email scheduled for ${scheduledDate} at ${scheduledTime}`,
    });

    // Reset form
    setCampaignName("");
    setSubject("");
    setContent("");
    setScheduledDate("");
    setScheduledTime("");
    setSelectedTemplate(null);
  };

  const handleSendNow = async () => {
    if (!campaignName || !subject || !content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const campaignId = addEmailCampaign({
        name: campaignName,
        subject,
        content,
        templateId: selectedTemplate || undefined,
        recipientGroup,
        status: 'sent',
      });

      await sendEmailCampaign(campaignId);

      toast({
        title: "Campaign Sent!",
        description: "Email campaign has been sent to recipients",
      });

      // Reset form
      setCampaignName("");
      setSubject("");
      setContent("");
      setSelectedTemplate(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send email campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Campaign Builder
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create and send email campaigns to your congregation
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="create">Create Campaign</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="flex-1 overflow-hidden flex flex-col mt-4">
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-2">
                {/* Campaign Name */}
                <div>
                  <Label htmlFor="campaign-name" className="text-sm font-medium text-gray-300 mb-2 block">
                    Campaign Name
                  </Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Weekly Newsletter - Week 1"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                {/* Recipient Group */}
                <div>
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">
                    Recipients
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['all', 'members', 'visitors'].map((group) => (
                      <button
                        key={group}
                        onClick={() => setRecipientGroup(group)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          recipientGroup === group
                            ? 'border-blue-500 bg-blue-600/20'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-sm font-medium text-white capitalize">{group}</div>
                        <div className="text-xs text-gray-400 mt-1">All {group}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-300 mb-2 block">
                    Subject Line
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content" className="text-sm font-medium text-gray-300 mb-2 block">
                    Email Content
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your email content here..."
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[300px]"
                  />
                </div>

                {/* Scheduling */}
                <div className="border-t border-gray-800 pt-4">
                  <Label className="text-sm font-medium text-gray-300 mb-3 block">Schedule (Optional)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Date</Label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400 mb-2 block">Time</Label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="border-gray-700 text-gray-300"
              >
                Save Draft
              </Button>
              {scheduledDate && scheduledTime ? (
                <Button
                  onClick={handleSchedule}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              ) : (
                <Button
                  onClick={handleSendNow}
                  disabled={!campaignName || !subject || !content}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
                        <p className="text-xs text-gray-400 mb-2">{template.subject}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{template.content}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

            <TabsContent value="campaigns" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full">
                {emailCampaigns.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No campaigns yet</p>
                  <p className="text-xs mt-2">Create your first email campaign</p>
                </div>
                ) : (
                <div className="space-y-3 p-2">
                  {emailCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white">{campaign.name}</h3>
                            <Badge
                              variant="outline"
                              className={
                                campaign.status === 'sent'
                                  ? 'bg-green-600/20 text-green-400 border-green-500/30'
                                  : campaign.status === 'scheduled'
                                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                                  : 'bg-gray-600/20 text-gray-400 border-gray-500/30'
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-1">{campaign.subject}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{campaign.recipients} recipients</span>
                            {campaign.scheduledFor && (
                              <span>Scheduled: {campaign.scheduledFor.toLocaleString()}</span>
                            )}
                            {campaign.sentAt && (
                              <span>Sent: {campaign.sentAt.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {campaign.status === 'draft' && (
                            <Button variant="ghost" size="sm" className="text-xs">
                              Edit
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 text-xs">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

