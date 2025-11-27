"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { FullCalendarComponent } from "@/components/calendar/full-calendar";
import { Calendar, List } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  isPublic: boolean;
  requiresRegistration: boolean;
  isPaid: boolean;
  price: number | null;
  posterUrl: string | null;
  campus: { id: string; name: string } | null;
  _count: { registrations: number; checkIns: number };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  extendedProps?: {
    type?: string;
    location?: string;
    description?: string;
    status?: string;
  };
}

const getEventColor = (type: string): string => {
  const colors: Record<string, string> = {
    SERVICE: "#3B82F6",
    MEETING: "#10B981",
    CONFERENCE: "#8B5CF6",
    OUTREACH: "#F59E0B",
    SOCIAL: "#EC4899",
    TRAINING: "#06B6D4",
    OTHER: "#6B7280",
  };
  return colors[type] || "#6B7280";
};

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [events, setEvents] = useState<Event[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "OTHER",
    status: "DRAFT",
    startDate: "",
    endDate: "",
    location: "",
    capacity: "",
    isPublic: "true",
    requiresRegistration: "false",
    isPaid: "false",
    price: "",
    posterUrl: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "1000", // Get all events for calendar
        ...(search && { search }),
      });
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      const fetchedEvents = data.events || [];
      
      // Filter events based on type filter
      const filteredEvents = typeFilter && typeFilter !== "all"
        ? fetchedEvents.filter((e: Event) => e.type === typeFilter)
        : fetchedEvents;
      
      setEvents(filteredEvents);
      setTotalPages(data.pagination?.totalPages || 1);

      // Convert to calendar format
      const calEvents: CalendarEvent[] = filteredEvents.map((event: Event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate || event.startDate,
        allDay: false,
        color: getEventColor(event.type),
        extendedProps: {
          type: event.type,
          location: event.location || undefined,
          description: event.description || undefined,
          status: event.status,
        },
      }));
      setCalendarEvents(calEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, search, typeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          isPublic: formData.isPublic === "true",
          requiresRegistration: formData.requiresRegistration === "true",
          isPaid: formData.isPaid === "true",
        }),
      });

      if (res.ok) {
        setOpen(false);
        setEditingEvent(null);
        setFormData({
          title: "",
          description: "",
          type: "OTHER",
          status: "DRAFT",
          startDate: "",
          endDate: "",
          location: "",
          capacity: "",
          isPublic: "true",
          requiresRegistration: "false",
          isPaid: "false",
          price: "",
          posterUrl: "",
        });
        fetchEvents();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save event");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      type: event.type,
      status: event.status,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().slice(0, 16)
        : "",
      location: event.location || "",
      capacity: event.capacity?.toString() || "",
      isPublic: event.isPublic.toString(),
      requiresRegistration: event.requiresRegistration.toString(),
      isPaid: event.isPaid.toString(),
      price: event.price?.toString() || "",
      posterUrl: event.posterUrl || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    const fullEvent = events.find((e) => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
      setEventDialogOpen(true);
    }
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setFormData({
      ...formData,
      startDate: start.toISOString().slice(0, 16),
      endDate: end.toISOString().slice(0, 16),
    });
    setOpen(true);
  };

  const handleEventCreate = async (event: CalendarEvent) => {
    // This will be handled by the form dialog
    return Promise.resolve();
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    const fullEvent = events.find((e) => e.id === event.id);
    if (fullEvent) {
      try {
        const res = await fetch(`/api/events/${fullEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: event.start,
            endDate: event.end || event.start,
          }),
        });
        if (res.ok) {
          fetchEvents();
        }
      } catch (error) {
        console.error("Error updating event:", error);
      }
    }
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/10 p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-5 dark:opacity-10"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-blue-100 dark:border-blue-900/50 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Events Management
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Organize and manage church events seamlessly
                </p>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    setEditingEvent(null);
                    setFormData({
                      title: "",
                      description: "",
                      type: "OTHER",
                      status: "DRAFT",
                      startDate: "",
                      endDate: "",
                      location: "",
                      capacity: "",
                      isPublic: "true",
                      requiresRegistration: "false",
                      isPaid: "false",
                      price: "",
                      posterUrl: "",
                    });
                  }}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Create New Event
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="CONFERENCE">Conference</SelectItem>
                      <SelectItem value="OUTREACH">Outreach</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="TRAINING">Training</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div>
                <CloudinaryUpload
                  folder="eastgatechapel/events/posters"
                  label="Event Poster"
                  onUploadComplete={(url) =>
                    setFormData({ ...formData, posterUrl: url })
                  }
                  currentImageUrl={formData.posterUrl || null}
                  accept="image/*"
                  maxSizeMB={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="isPublic">Public</Label>
                  <Select
                    value={formData.isPublic}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isPublic: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requiresRegistration">Requires Registration</Label>
                  <Select
                    value={formData.requiresRegistration}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        requiresRegistration: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isPaid">Paid Event</Label>
                  <Select
                    value={formData.isPaid}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isPaid: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800 p-2">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <TabsTrigger 
              value="calendar" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger 
              value="list"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <List className="w-4 h-4 mr-2" />
              List View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-2 border-blue-100 dark:border-blue-900/50 hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Events</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{events.length}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-2 border-green-100 dark:border-green-900/50 hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Published</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      {events.filter((e) => e.status === "PUBLISHED").length}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Badge className="text-lg font-bold bg-white text-green-600 hover:bg-white">✓</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50 hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">This Month</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                      {
                        events.filter((e) => {
                          const eventDate = new Date(e.startDate);
                          const now = new Date();
                          return (
                            eventDate.getMonth() === now.getMonth() &&
                            eventDate.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-2 border-purple-100 dark:border-purple-900/50 hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full -mr-16 -mt-16 opacity-10"></div>
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Upcoming</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                      {
                        events.filter((e) => {
                          const eventDate = new Date(e.startDate);
                          return eventDate > new Date();
                        }).length
                      }
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar with Filters */}
          <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b-2 border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Event Calendar
                  </CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                      setTypeFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-48 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-400 transition-colors">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="CONFERENCE">Conference</SelectItem>
                      <SelectItem value="OUTREACH">Outreach</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="TRAINING">Training</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Event Type Legend */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border-2 border-blue-100 dark:border-blue-900/50">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  Event Types Legend:
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { type: "SERVICE", color: "#3B82F6", label: "Service" },
                    { type: "MEETING", color: "#10B981", label: "Meeting" },
                    { type: "CONFERENCE", color: "#F59E0B", label: "Conference" },
                    { type: "OUTREACH", color: "#EF4444", label: "Outreach" },
                    { type: "SOCIAL", color: "#8B5CF6", label: "Social" },
                    { type: "TRAINING", color: "#06B6D4", label: "Training" },
                    { type: "OTHER", color: "#6B7280", label: "Other" },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div
                        className="w-4 h-4 rounded-full shadow-md"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading calendar...</div>
              ) : (
                <FullCalendarComponent
                  events={calendarEvents}
                  onEventClick={handleEventClick}
                  onDateSelect={handleDateSelect}
                  onEventCreate={handleEventCreate}
                  onEventUpdate={handleEventUpdate}
                  height="600px"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-8">
          <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b-2 border-gray-100 dark:border-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <List className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    All Events
                  </CardTitle>
                </div>
                <Input
                  placeholder="🔍 Search events..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="max-w-sm border-2 border-gray-200 dark:border-gray-700 shadow-sm focus:border-blue-400 transition-colors"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No events found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                        <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                          <TableHead className="font-bold text-gray-700 dark:text-gray-300">Title</TableHead>
                          <TableHead className="font-bold text-gray-700 dark:text-gray-300">Type</TableHead>
                          <TableHead className="font-bold text-gray-700 dark:text-gray-300">Start Date</TableHead>
                          <TableHead className="font-bold text-gray-700 dark:text-gray-300">Status</TableHead>
                          <TableHead className="font-bold text-gray-700 dark:text-gray-300">Registrations</TableHead>
                          <TableHead className="font-bold text-gray-700 dark:text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event, index) => (
                          <TableRow 
                            key={event.id} 
                            className={`border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                            }`}
                          >
                            <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                              {event.title}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className="border-2 font-semibold"
                                style={{ 
                                  borderColor: getEventColor(event.type),
                                  color: getEventColor(event.type)
                                }}
                              >
                                {event.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {new Date(event.startDate).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className="font-semibold shadow-sm"
                                variant={
                                  event.status === "PUBLISHED"
                                    ? "default"
                                    : event.status === "DRAFT"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {event.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-blue-600">{event._count.registrations}</span>
                                {event.capacity && (
                                  <span className="text-sm text-gray-500">/ {event.capacity}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(event)}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(event.id)}
                                  className="shadow-sm"
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-between items-center p-4 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-2 hover:border-blue-400 transition-colors"
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-2 hover:border-blue-400 transition-colors"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.posterUrl && (
                <img
                  src={selectedEvent.posterUrl}
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedEvent.description || "No description"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedEvent.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge
                    variant={
                      selectedEvent.status === "PUBLISHED"
                        ? "default"
                        : selectedEvent.status === "DRAFT"
                        ? "secondary"
                        : "destructive"
                    }
                    className="mt-1"
                  >
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Start Date</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(selectedEvent.startDate).toLocaleString()}
                  </p>
                </div>
                {selectedEvent.endDate && (
                  <div>
                    <Label className="text-sm font-semibold">End Date</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(selectedEvent.endDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedEvent.location && (
                <div>
                  <Label className="text-sm font-semibold">Location</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedEvent.location}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Registrations</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedEvent._count.registrations}
                    {selectedEvent.capacity && ` / ${selectedEvent.capacity}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Check-ins</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedEvent._count.checkIns}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleEdit(selectedEvent);
                    setEventDialogOpen(false);
                  }}
                >
                  Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEventDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
