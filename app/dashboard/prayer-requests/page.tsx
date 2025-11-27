"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Plus, Search, Filter, Clock, User, CheckCircle2, Lock, Eye, EyeOff, MessageSquare, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  privacy: string;
  isAnonymous: boolean;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  answeredAt?: string;
  answerNotes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    prayers: number;
    updates: number;
  };
}

export default function PrayerRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "OTHER",
    privacy: "MEMBERS_ONLY",
    isAnonymous: false,
  });

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, categoryFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/prayer-requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      toast({
        title: "Error",
        description: "Failed to load prayer requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Prayer request created successfully",
        });
        setIsCreateOpen(false);
        setFormData({
          title: "",
          content: "",
          category: "OTHER",
          privacy: "MEMBERS_ONLY",
          isAnonymous: false,
        });
        fetchRequests();
      } else {
        throw new Error("Failed to create");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prayer request",
        variant: "destructive",
      });
    }
  };

  const handleCommitToPray = async (requestId: string) => {
    try {
      const res = await fetch(`/api/prayer-requests/${requestId}/pray`, {
        method: "POST",
      });

      if (res.ok) {
        toast({
          title: "Thank you!",
          description: "You've committed to pray for this request",
        });
        fetchRequests();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to commit to prayer",
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(query) ||
        req.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "ANSWERED":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "CLOSED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      HEALTH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      FAMILY: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      FINANCIAL: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      SPIRITUAL: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      WORK: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      RELATIONSHIPS: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-600" />
            Prayer Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Submit and manage prayer requests for the church community
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Prayer Request</DialogTitle>
              <DialogDescription>
                Share your prayer need with the church community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief title for your prayer request"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Details</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Share the details of your prayer need..."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEALTH">Health</SelectItem>
                      <SelectItem value="FAMILY">Family</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="SPIRITUAL">Spiritual</SelectItem>
                      <SelectItem value="WORK">Work</SelectItem>
                      <SelectItem value="RELATIONSHIPS">Relationships</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Privacy</label>
                  <Select
                    value={formData.privacy}
                    onValueChange={(value) =>
                      setFormData({ ...formData, privacy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                      <SelectItem value="LEADERS_ONLY">Leaders Only</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, isAnonymous: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="anonymous" className="text-sm">
                  Submit anonymously
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-pink-600 hover:bg-pink-700">
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search prayer requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ANSWERED">Answered</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="HEALTH">Health</SelectItem>
            <SelectItem value="FAMILY">Family</SelectItem>
            <SelectItem value="FINANCIAL">Financial</SelectItem>
            <SelectItem value="SPIRITUAL">Spiritual</SelectItem>
            <SelectItem value="WORK">Work</SelectItem>
            <SelectItem value="RELATIONSHIPS">Relationships</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "ACTIVE").length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Answered</p>
                <p className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "ANSWERED").length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold">
                  {requests.filter(
                    (r) =>
                      new Date(r.createdAt).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prayer Requests List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-gray-500">Loading prayer requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No prayer requests found</p>
            <p className="text-gray-400 text-sm mt-2">
              Be the first to submit a prayer request
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <Card
              key={request.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {request.isAnonymous ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {request.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <Badge variant="outline" className={getCategoryColor(request.category)}>
                      {request.category.replace("_", " ")}
                    </Badge>
                    {!request.isAnonymous && request.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {request.author.firstName} {request.author.lastName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {request._count && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Heart className="w-3 h-3" />
                      <span>{request._count.prayers} praying</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCommitToPray(request.id);
                    }}
                    className="flex-1"
                  >
                    <Heart className="w-3 h-3 mr-2" />
                    Commit to Pray
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(request);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRequest.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                  <Badge variant="outline" className={getCategoryColor(selectedRequest.category)}>
                    {selectedRequest.category.replace("_", " ")}
                  </Badge>
                  {selectedRequest.isAnonymous && (
                    <Badge variant="outline">
                      <Lock className="w-3 h-3 mr-1" />
                      Anonymous
                    </Badge>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Details</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {selectedRequest.content}
                </p>
              </div>
              {selectedRequest.answeredAt && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Prayer Answered
                    </h4>
                  </div>
                  {selectedRequest.answerNotes && (
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {selectedRequest.answerNotes}
                    </p>
                  )}
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Answered{" "}
                    {formatDistanceToNow(new Date(selectedRequest.answeredAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    {!selectedRequest.isAnonymous && selectedRequest.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {selectedRequest.author.firstName}{" "}
                          {selectedRequest.author.lastName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(selectedRequest.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {selectedRequest._count && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{selectedRequest._count.prayers} people praying</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleCommitToPray(selectedRequest.id)}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Commit to Pray
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

