"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Send,
  Eye,
  EyeOff,
  Calendar,
  Users,
  AlertCircle,
  Bell,
  Church,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetAudience: string;
  targetChurches: string | null;
  category: string;
  publishAt: string | null;
  expiresAt: string | null;
  isPublished: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  _count?: {
    reads: number;
  };
}

interface Church {
  id: string;
  name: string;
}

export default function SystemAnnouncementsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetAudience, setTargetAudience] = useState("all");
  const [selectedChurches, setSelectedChurches] = useState<string[]>([]);
  const [category, setCategory] = useState("general");
  const [publishAt, setPublishAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchChurches();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    try {
      const res = await fetch("/api/admin/churches");
      if (res.ok) {
        const data = await res.json();
        setChurches(data.churches || []);
      }
    } catch (error) {
      console.error("Error fetching churches:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPriority("normal");
    setTargetAudience("all");
    setSelectedChurches([]);
    setCategory("general");
    setPublishAt("");
    setExpiresAt("");
    setIsPublished(false);
    setIsPinned(false);
    setEditingAnnouncement(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (announcement: SystemAnnouncement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setTargetAudience(announcement.targetAudience);
    setSelectedChurches(announcement.targetChurches ? announcement.targetChurches.split(",") : []);
    setCategory(announcement.category);
    setPublishAt(announcement.publishAt ? format(new Date(announcement.publishAt), "yyyy-MM-dd'T'HH:mm") : "");
    setExpiresAt(announcement.expiresAt ? format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm") : "");
    setIsPublished(announcement.isPublished);
    setIsPinned(announcement.isPinned);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      title,
      content,
      priority,
      targetAudience,
      targetChurches: targetAudience === "specific_churches" ? selectedChurches.join(",") : null,
      category,
      publishAt: publishAt || null,
      expiresAt: expiresAt || null,
      isPublished,
      isPinned,
    };

    try {
      const url = editingAnnouncement
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : "/api/admin/announcements";
      const method = editingAnnouncement ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `Announcement ${editingAnnouncement ? "updated" : "created"} successfully`,
        });
        setDialogOpen(false);
        fetchAnnouncements();
        resetForm();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to save announcement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Announcement deleted successfully",
        });
        fetchAnnouncements();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete announcement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    }
  };

  const togglePin = async (announcement: SystemAnnouncement) => {
    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...announcement, isPinned: !announcement.isPinned }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: announcement.isPinned ? "Unpinned" : "Pinned",
        });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (announcement: SystemAnnouncement) => {
    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...announcement, isPublished: !announcement.isPublished }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: announcement.isPublished ? "Unpublished" : "Published",
        });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
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
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "maintenance":
        return <AlertCircle className="w-4 h-4" />;
      case "update":
        return <Bell className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      default:
        return <Megaphone className="w-4 h-4" />;
    }
  };

  const getTargetAudienceLabel = (audience: string) => {
    switch (audience) {
      case "all":
        return "All Users";
      case "superadmins":
        return "Super Admins Only";
      case "church_admins":
        return "Church Admins";
      case "specific_churches":
        return "Specific Churches";
      default:
        return audience;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Announcements</h1>
          <p className="text-muted-foreground">Manage system-wide announcements and communications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? "Edit Announcement" : "Create System Announcement"}
              </DialogTitle>
              <DialogDescription>
                Create announcements for system admins, church admins, or all users
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Announcement content"
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="update">System Update</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger id="targetAudience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="superadmins">Super Admins Only</SelectItem>
                    <SelectItem value="church_admins">Church Admins</SelectItem>
                    <SelectItem value="specific_churches">Specific Churches</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetAudience === "specific_churches" && (
                <div>
                  <Label>Select Churches</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {churches.map((church) => (
                      <label key={church.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedChurches.includes(church.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChurches([...selectedChurches, church.id]);
                            } else {
                              setSelectedChurches(selectedChurches.filter((id) => id !== church.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span>{church.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publishAt">Publish At (Optional)</Label>
                  <Input
                    id="publishAt"
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded"
                  />
                  <span>Publish immediately</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded"
                  />
                  <span>Pin to top</span>
                </label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  {editingAnnouncement ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No system announcements yet. Create your first announcement.
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.isPinned ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.isPinned && <Pin className="w-4 h-4 text-primary" />}
                      {getCategoryIcon(announcement.category)}
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {getTargetAudienceLabel(announcement.targetAudience)}
                      </Badge>
                      <Badge variant="outline">{announcement.category}</Badge>
                      {!announcement.isPublished && (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                      {announcement.publishAt && new Date(announcement.publishAt) > new Date() && (
                        <Badge variant="secondary">
                          <Calendar className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(announcement)}
                      title={announcement.isPinned ? "Unpin" : "Pin"}
                    >
                      {announcement.isPinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublish(announcement)}
                      title={announcement.isPublished ? "Unpublish" : "Publish"}
                    >
                      {announcement.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(announcement)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{announcement.content}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    By {announcement.author.firstName} {announcement.author.lastName}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(announcement.createdAt), "PPp")}</span>
                  {announcement._count?.reads && (
                    <>
                      <span>•</span>
                      <span>{announcement._count.reads} reads</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
