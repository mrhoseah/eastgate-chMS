"use client";

import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Share2, 
  Mail, 
  MessageSquare,
  Clock,
  MapPin,
  Users,
  Send,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface EventPromotionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
}

export function EventPromotion({ open, onOpenChange, eventId }: EventPromotionProps) {
  const { toast } = useToast();
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [promotionSchedule, setPromotionSchedule] = useState({
    initial: { date: "", time: "" },
    reminder: { date: "", time: "" },
    lastCall: { date: "", time: "" },
  });

  const channels = [
    { id: 'facebook', name: 'Facebook', icon: <Share2 className="w-4 h-4" /> },
    { id: 'instagram', name: 'Instagram', icon: <Share2 className="w-4 h-4" /> },
    { id: 'twitter', name: 'Twitter', icon: <Share2 className="w-4 h-4" /> },
    { id: 'email', name: 'Email', icon: <Mail className="w-4 h-4" /> },
    { id: 'sms', name: 'SMS', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const handleToggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  const handlePromote = () => {
    if (selectedChannels.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one promotion channel",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Event Promoted!",
      description: `Event promoted across ${selectedChannels.length} channel(s)`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Promote Event
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Promote your event across multiple marketing channels
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-2">
            {/* Event Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Event Information</h3>
              
              <div>
                <Label htmlFor="event-name" className="text-xs text-gray-400 mb-2 block">
                  Event Name
                </Label>
                <Input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Event name"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="event-date" className="text-xs text-gray-400 mb-2 block">
                    Date
                  </Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="event-time" className="text-xs text-gray-400 mb-2 block">
                    Time
                  </Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="event-location" className="text-xs text-gray-400 mb-2 block">
                  Location
                </Label>
                <Input
                  id="event-location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Event location"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="event-description" className="text-xs text-gray-400 mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="event-description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Event description"
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>
            </div>

            {/* Promotion Channels */}
            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Promotion Channels</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleToggleChannel(channel.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedChannels.includes(channel.id)
                        ? 'border-blue-500 bg-blue-600/20'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      {channel.icon}
                    </div>
                    <div className="text-xs font-medium text-white">{channel.name}</div>
                    {selectedChannels.includes(channel.id) && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400 mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Promotion Schedule */}
            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Promotion Schedule (Optional)</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">Initial Promotion</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={promotionSchedule.initial.date}
                      onChange={(e) => setPromotionSchedule({
                        ...promotionSchedule,
                        initial: { ...promotionSchedule.initial, date: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                    />
                    <Input
                      type="time"
                      value={promotionSchedule.initial.time}
                      onChange={(e) => setPromotionSchedule({
                        ...promotionSchedule,
                        initial: { ...promotionSchedule.initial, time: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">Reminder</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={promotionSchedule.reminder.date}
                      onChange={(e) => setPromotionSchedule({
                        ...promotionSchedule,
                        reminder: { ...promotionSchedule.reminder, date: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                    />
                    <Input
                      type="time"
                      value={promotionSchedule.reminder.time}
                      onChange={(e) => setPromotionSchedule({
                        ...promotionSchedule,
                        reminder: { ...promotionSchedule.reminder, time: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">Last Call</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={promotionSchedule.lastCall.date}
                      onChange={(e) => setPromotionSchedule({
                        ...promotionSchedule,
                        lastCall: { ...promotionSchedule.lastCall, date: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                    />
                    <Input
                      type="time"
                      value={promotionSchedule.lastCall.time}
                      onChange={(e) => setPromotionSchedule({
                        ...promotionSchedule,
                        lastCall: { ...promotionSchedule.lastCall, time: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {eventName && (
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Preview</h3>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-white mb-2">{eventName}</h4>
                  {eventDate && eventTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                      <Clock className="w-4 h-4" />
                      {new Date(`${eventDate}T${eventTime}`).toLocaleString()}
                    </div>
                  )}
                  {eventLocation && (
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                      <MapPin className="w-4 h-4" />
                      {eventLocation}
                    </div>
                  )}
                  {eventDescription && (
                    <p className="text-sm text-gray-400 mt-3">{eventDescription}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={selectedChannels.length === 0 || !eventName}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Promote Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

