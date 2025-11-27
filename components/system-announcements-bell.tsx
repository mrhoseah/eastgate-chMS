"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Bell, X, Pin } from "lucide-react";
import { format } from "date-fns";

interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  isRead: boolean;
}

export function SystemAnnouncementsBell() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetchAnnouncements();
    }
  }, [session]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/system-announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
        setUnreadCount(data.announcements.filter((a: SystemAnnouncement) => !a.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching system announcements:", error);
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      await fetch("/api/system-announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
      });
      
      // Update local state
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "urgent":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "high":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  if (!session?.user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            System Announcements
          </SheetTitle>
          <SheetDescription>
            Important updates and announcements from the system administrators
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${
                    !announcement.isRead
                      ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      : "bg-background"
                  } ${announcement.isPinned ? "border-primary" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.isPinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <h4 className="font-semibold">{announcement.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge className={getPriorityColor(announcement.priority)} variant="secondary">
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline">{announcement.category}</Badge>
                        {!announcement.isRead && (
                          <Badge variant="default">New</Badge>
                        )}
                      </div>
                    </div>
                    {!announcement.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(announcement.id)}
                        title="Mark as read"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap mb-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {announcement.author.firstName} {announcement.author.lastName}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(announcement.createdAt), "PPp")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
