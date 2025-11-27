"use client";

import { useState, useMemo } from "react";
import {
  Upload,
  Pencil,
  Monitor,
  LayoutGrid,
  Settings,
  X,
  Plus,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize,
  Mic,
  Timer,
  FileText,
  Trash2,
  Copy,
  Share2,
  Clock,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// --- Types ---
interface Presentation {
  id: string;
  title: string;
  description: string;
  slides: number;
  thumbnailColor: string;
  lastEdited: string;
  createdAt: string;
  createdBy: string;
  isStarred: boolean;
  status: "draft" | "published" | "archived";
}

// --- Mock Data ---
const INITIAL_PRESENTATIONS: Presentation[] = [
  {
    id: "1",
    title: "Sunday Service - Nov 24",
    description: "Main sermon presentation for Sunday worship",
    slides: 12,
    thumbnailColor: "bg-blue-600",
    lastEdited: "2 hours ago",
    createdAt: "Nov 22, 2025",
    createdBy: "John Pastor",
    isStarred: true,
    status: "published",
  },
  {
    id: "2",
    title: "Discipleship Training",
    description: "Weekly small group study materials",
    slides: 8,
    thumbnailColor: "bg-indigo-600",
    lastEdited: "1 day ago",
    createdAt: "Nov 20, 2025",
    createdBy: "Sarah Leader",
    isStarred: false,
    status: "published",
  },
  {
    id: "3",
    title: "Youth Group Kickoff",
    description: "Fall semester launch presentation",
    slides: 15,
    thumbnailColor: "bg-purple-600",
    lastEdited: "3 days ago",
    createdAt: "Nov 18, 2025",
    createdBy: "Mike Youth",
    isStarred: false,
    status: "draft",
  },
  {
    id: "4",
    title: "Missions Update 2025",
    description: "Annual missions trip highlights and prayer requests",
    slides: 20,
    thumbnailColor: "bg-green-600",
    lastEdited: "1 week ago",
    createdAt: "Nov 10, 2025",
    createdBy: "Linda Missions",
    isStarred: true,
    status: "published",
  },
  {
    id: "5",
    title: "Q4 Budget Review",
    description: "Financial overview and giving dashboard",
    slides: 10,
    thumbnailColor: "bg-amber-600",
    lastEdited: "2 weeks ago",
    createdAt: "Nov 5, 2025",
    createdBy: "Tom Finance",
    isStarred: false,
    status: "archived",
  },
];

// --- Components ---

interface PresentationCardProps {
  presentation: Presentation;
  onEdit: (id: string) => void;
  onPresent: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleStar: (id: string) => void;
}

const PresentationCard: React.FC<PresentationCardProps> = ({
  presentation,
  onEdit,
  onPresent,
  onDelete,
  onDuplicate,
  onToggleStar,
}) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden">
      <div className="relative">
        {/* Thumbnail */}
        <div
          className={`h-40 ${presentation.thumbnailColor} flex items-center justify-center text-white relative overflow-hidden group-hover:brightness-110 transition-all`}
        >
          <LayoutGrid className="w-12 h-12 opacity-80" />
          <Badge
            className="absolute top-3 right-3"
            variant={
              presentation.status === "published"
                ? "default"
                : presentation.status === "draft"
                  ? "secondary"
                  : "outline"
            }
          >
            {presentation.status.charAt(0).toUpperCase() + presentation.status.slice(1)}
          </Badge>
        </div>

        {/* Slide Count Badge */}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm">
          {presentation.slides} slides
        </div>
      </div>

      <CardContent className="pt-4 pb-3">
        <h3 className="font-bold text-slate-900 truncate mb-1">{presentation.title}</h3>
        <p className="text-xs text-slate-600 line-clamp-2 mb-3">{presentation.description}</p>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {presentation.lastEdited}
          </span>
          <button
            onClick={() => onToggleStar(presentation.id)}
            className="text-slate-400 hover:text-yellow-500 transition-colors"
          >
            {presentation.isStarred ? "⭐" : "☆"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(presentation.id)}
          >
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onPresent(presentation.id)}
          >
            <Monitor className="w-3 h-3 mr-1" /> Present
          </Button>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="w-full">
              <MoreHorizontal className="w-4 h-4 mr-1" /> More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onDuplicate(presentation.id)}>
              <Copy className="w-4 h-4 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(presentation.id)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

interface ViewState = "grid" | "list";

// --- Main Component ---

export default function PresentationsPage() {
  const [presentations, setPresentations] = useState<Presentation[]>(INITIAL_PRESENTATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [viewMode, setViewMode] = useState<ViewState>("grid");
  const { toast } = useToast();

  // Filtered presentations
  const filteredPresentations = useMemo(() => {
    return presentations.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [presentations, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: presentations.length,
      published: presentations.filter((p) => p.status === "published").length,
      draft: presentations.filter((p) => p.status === "draft").length,
      archived: presentations.filter((p) => p.status === "archived").length,
      starred: presentations.filter((p) => p.isStarred).length,
    }),
    [presentations]
  );

  const handleEdit = (id: string) => {
    const presentation = presentations.find((p) => p.id === id);
    if (presentation) {
      window.location.href = `/dashboard/presentations/${id}/editor`;
    }
  };

  const handlePresent = (id: string) => {
    const presentation = presentations.find((p) => p.id === id);
    if (presentation) {
      window.location.href = `/dashboard/presentations/${id}/present`;
    }
  };

  const handleDelete = (id: string) => {
    setPresentations(presentations.filter((p) => p.id !== id));
    toast({
      title: "Presentation deleted",
      description: "The presentation has been removed.",
    });
  };

  const handleDuplicate = (id: string) => {
    const presentation = presentations.find((p) => p.id === id);
    if (presentation) {
      const newPresentation: Presentation = {
        ...presentation,
        id: Math.random().toString(36).substr(2, 9),
        title: `${presentation.title} (Copy)`,
        createdAt: new Date().toLocaleDateString(),
      };
      setPresentations([newPresentation, ...presentations]);
      toast({
        title: "Presentation duplicated",
        description: `"${presentation.title}" has been copied.`,
      });
    }
  };

  const handleToggleStar = (id: string) => {
    setPresentations(
      presentations.map((p) =>
        p.id === id ? { ...p, isStarred: !p.isStarred } : p
      )
    );
  };

  const handleCreateNew = () => {
    // Navigate to create new presentation
    window.location.href = "/dashboard/presentations/new";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
                <Monitor className="w-8 h-8 text-blue-600" />
                Presentations
              </h1>
              <p className="text-slate-600 mt-2">Create and manage your sermon and event presentations</p>
            </div>
            <Button
              size="lg"
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Presentation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-slate-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <p className="text-sm text-slate-600">Total Presentations</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                <p className="text-sm text-slate-600">Published</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
                <p className="text-sm text-slate-600">Drafts</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-slate-500">{stats.archived}</div>
                <p className="text-sm text-slate-600">Archived</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-500">{stats.starred}</div>
                <p className="text-sm text-slate-600">Starred</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search presentations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-slate-300"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "published" | "draft" | "archived")
              }
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="border-slate-300"
            >
              {viewMode === "grid" ? <FileText className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {filteredPresentations.length === 0 && (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="pt-16 pb-16 text-center">
              <Monitor className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No presentations found</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Create your first presentation to get started!"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Presentation
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grid View */}
        {viewMode === "grid" && filteredPresentations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPresentations.map((presentation) => (
              <PresentationCard
                key={presentation.id}
                presentation={presentation}
                onEdit={handleEdit}
                onPresent={handlePresent}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && filteredPresentations.length > 0 && (
          <div className="space-y-2">
            {filteredPresentations.map((presentation) => (
              <Card key={presentation.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <div
                        className={`${presentation.thumbnailColor} w-12 h-12 rounded flex items-center justify-center text-white flex-shrink-0`}
                      >
                        <LayoutGrid className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{presentation.title}</h3>
                          <Badge
                            variant={
                              presentation.status === "published"
                                ? "default"
                                : presentation.status === "draft"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="flex-shrink-0"
                          >
                            {presentation.status}
                          </Badge>
                          {presentation.isStarred && <span className="text-yellow-500">⭐</span>}
                        </div>
                        <p className="text-xs text-slate-600">
                          {presentation.slides} slides • Edited {presentation.lastEdited}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(presentation.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handlePresent(presentation.id)}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDuplicate(presentation.id)}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="w-4 h-4 mr-2" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(presentation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
