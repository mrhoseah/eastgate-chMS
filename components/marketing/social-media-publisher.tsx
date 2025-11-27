"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Calendar,
  Image as ImageIcon,
  Send,
  Checkbox
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMarketingStore } from "@/lib/store/marketing-store";

interface SocialMediaPublisherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationId?: string;
  content?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
}

const platforms = [
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-4 h-4" />, color: 'text-blue-500' },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-4 h-4" />, color: 'text-pink-500' },
  { id: 'twitter', name: 'Twitter/X', icon: <Twitter className="w-4 h-4" />, color: 'text-blue-400' },
  { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-4 h-4" />, color: 'text-red-500' },
];

export function SocialMediaPublisher({ open, onOpenChange, presentationId, content }: SocialMediaPublisherProps) {
  const { toast } = useToast();
  const { addSocialPost, publishSocialPost } = useMarketingStore();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [message, setMessage] = useState(content?.title || "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [imageUrl, setImageUrl] = useState(content?.imageUrl || "");

  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platform Selected",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to post",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create posts for each selected platform
      const postPromises = selectedPlatforms.map(async (platform) => {
        const postId = addSocialPost({
          platform: platform as any,
          content: message,
          imageUrl: imageUrl || undefined,
          status: scheduledDate && scheduledTime ? 'scheduled' : 'draft',
          scheduledFor: scheduledDate && scheduledTime 
            ? new Date(`${scheduledDate}T${scheduledTime}`)
            : undefined,
        });

        // If not scheduled, publish immediately
        if (!scheduledDate || !scheduledTime) {
          await publishSocialPost(postId);
        }
      });

      await Promise.all(postPromises);

      toast({
        title: scheduledDate && scheduledTime ? "Scheduled!" : "Published!",
        description: `${scheduledDate && scheduledTime ? 'Scheduled' : 'Posted'} to ${selectedPlatforms.length} platform(s)`,
      });

      // Reset form
      setSelectedPlatforms([]);
      setMessage("");
      setScheduledDate("");
      setScheduledTime("");
      setImageUrl("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Publish Failed",
        description: "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0 || !message.trim() || !scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      selectedPlatforms.forEach((platform) => {
        addSocialPost({
          platform: platform as any,
          content: message,
          imageUrl: imageUrl || undefined,
          status: 'scheduled',
          scheduledFor: new Date(`${scheduledDate}T${scheduledTime}`),
        });
      });

      toast({
        title: "Scheduled!",
        description: `Post scheduled for ${scheduledDate} at ${scheduledTime}`,
      });

      // Reset form
      setSelectedPlatforms([]);
      setMessage("");
      setScheduledDate("");
      setScheduledTime("");
      setImageUrl("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Schedule Failed",
        description: "Failed to schedule post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Send className="w-5 h-5" />
            Publish to Social Media
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your presentation or content across social media platforms
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Platform Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-3 block">Select Platforms</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleTogglePlatform(platform.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className={`flex items-center justify-center mb-2 ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <div className="text-xs font-medium text-white">{platform.name}</div>
                  {selectedPlatforms.includes(platform.id) && (
                    <div className="text-xs text-blue-400 mt-1">Selected</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-300 mb-2 block">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your post message..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[120px]"
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length} characters
            </div>
          </div>

          {/* Image URL */}
          <div>
            <Label htmlFor="image" className="text-sm font-medium text-gray-300 mb-2 block">
              Image URL (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scheduling */}
          <div className="border-t border-gray-800 pt-4">
            <Label className="text-sm font-medium text-gray-300 mb-3 block">Schedule Post (Optional)</Label>
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

          {/* Preview */}
          {message && (
            <div className="border-t border-gray-800 pt-4">
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Preview</Label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                {imageUrl && (
                  <div className="w-full h-48 bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{message}</p>
                {presentationId && (
                  <div className="mt-3 text-xs text-blue-400">
                    View Presentation →
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300"
          >
            Cancel
          </Button>
          {scheduledDate && scheduledTime ? (
            <Button
              onClick={handleSchedule}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Post
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={selectedPlatforms.length === 0 || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Publish Now
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

