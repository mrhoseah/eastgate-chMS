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
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar as CalendarIcon, 
  Mail, 
  Share2, 
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useMarketingStore } from "@/lib/store/marketing-store";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface MarketingCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketingCalendar({ open, onOpenChange }: MarketingCalendarProps) {
  const { socialPosts, emailCampaigns } = useMarketingStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isDialog = onOpenChange !== undefined && typeof onOpenChange === 'function';

  // Get all scheduled items
  const scheduledItems = [
    ...socialPosts
      .filter(p => p.status === 'scheduled' && p.scheduledFor)
      .map(p => ({
        id: p.id,
        type: 'social' as const,
        platform: p.platform,
        title: p.content.substring(0, 50),
        scheduledFor: p.scheduledFor!,
        status: p.status,
      })),
    ...emailCampaigns
      .filter(c => c.status === 'scheduled' && c.scheduledFor)
      .map(c => ({
        id: c.id,
        type: 'email' as const,
        platform: 'email' as const,
        title: c.subject,
        scheduledFor: c.scheduledFor!,
        status: c.status,
      })),
  ].sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  const selectedDateItems = scheduledItems.filter(item => 
    format(item.scheduledFor, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const getDateItems = (date: Date) => {
    return scheduledItems.filter(item =>
      format(item.scheduledFor, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).length;
  };

  const content = (
    <div className="flex-1 flex gap-4 overflow-hidden h-full">
            {/* Calendar */}
            <div className="w-80">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border border-gray-700 bg-gray-800"
              modifiers={{
                hasItems: (date) => getDateItems(date) > 0,
              }}
              modifiersClassNames={{
                hasItems: "bg-blue-600/20 text-blue-400 font-bold",
              }}
            />
            <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="text-xs text-gray-400 mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600/20 border border-blue-500"></div>
                  <span className="text-gray-300">Has scheduled items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Items */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-xs text-gray-400">
                {selectedDateItems.length} scheduled item{selectedDateItems.length !== 1 ? 's' : ''}
              </p>
            </div>

            <ScrollArea className="flex-1">
              {selectedDateItems.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No scheduled items for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'email' 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-purple-600/20 text-purple-400'
                        }`}>
                          {item.type === 'email' ? (
                            <Mail className="w-4 h-4" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                            <Badge
                              variant="outline"
                              className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs"
                            >
                              Scheduled
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(item.scheduledFor, 'h:mm a')}
                            </div>
                            {item.type === 'social' && (
                              <span className="capitalize">{item.platform}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
  );

  if (isDialog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Marketing Calendar
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              View and manage all scheduled marketing activities
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
          <CalendarIcon className="w-5 h-5" />
          Marketing Calendar
        </h2>
        <p className="text-sm text-gray-400 mt-1">View and manage all scheduled marketing activities</p>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        {content}
      </div>
    </div>
  );
}

