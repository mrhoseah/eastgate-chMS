"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Clock,
  Eye,
  Grid3x3,
  HelpCircle,
  LayoutGrid,
  Layers,
  LayoutTemplate,
  List,
  Maximize2,
  MonitorPlay,
  MousePointer2,
  Pencil,
  Play,
  Plus,
  Save,
  Share2,
  Square,
  Table,
  Type as TypeIcon,
  Image as ImageIcon2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedWYSIWYGCanvas } from "@/components/presentations/enhanced-wysiwyg-canvas";
import { PropertiesPanel } from "@/components/presentations/properties-panel";
import { ChartDialog } from "@/components/presentations/chart-dialog";
import { TableDialog } from "@/components/presentations/table-dialog";
import { StoryboardView } from "@/components/presentations/storyboard-view";
import { PresentationPreviewPanel } from "@/components/presentations/presentation-preview-panel";
import { PreziCanvasView } from "@/components/presentations/prezi-canvas-view";
import { ContextToolbar } from "@/components/presentations/context-toolbar";
import { HamburgerMenu } from "@/components/presentations/hamburger-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AIPresentationGenerator } from "@/components/presentations/ai-presentation-generator";

type PresentationStatus = "draft" | "published" | "archived";
type PreviewMode = "edit" | "preview" | "split" | "prezi";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const presentationId = params.id as string;
  const { toast } = useToast();

  const [selectedSlide, setSelectedSlide] = useState(0);
  const [presentationTitle, setPresentationTitle] = useState("Untitled Presentation");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShapeType, setSelectedShapeType] = useState<string>('rect');
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [presentationStatus, setPresentationStatus] = useState<PresentationStatus>('draft');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const collaborators = useMemo(
    () => [
      { initials: "JP", color: "bg-blue-500" },
      { initials: "SL", color: "bg-emerald-500" },
      { initials: "MT", color: "bg-amber-500" },
    ],
    []
  );

  const lastSavedLabel = useMemo(() => {
    if (isSaving) return "Saving...";
    if (!lastSavedAt) return "Not saved yet";

    const savedDate = new Date(lastSavedAt);
    const diffMs = Date.now() - savedDate.getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) {
      return "Saved just now";
    }

    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes === 0) return "Saved moments ago";
    if (diffMinutes === 1) return "Saved a minute ago";
    if (diffMinutes < 60) return `Saved ${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "Saved an hour ago";
    if (diffHours < 24) return `Saved ${diffHours} hrs ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Saved yesterday";
    return `Saved ${diffDays} days ago`;
  }, [isSaving, lastSavedAt]);

  const statusStyles: Record<PresentationStatus, string> = {
    draft: "bg-amber-50 text-amber-700 border border-amber-200",
    published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    archived: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  const statusLabels: Record<PresentationStatus, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };

  // Close shape selector when clicking outside
  useEffect(() => {
    if (!showShapeSelector) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-shape-selector]')) {
        setShowShapeSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShapeSelector]);

  const {
    frames,
    path,
    currentFrameId,
    goToFrame,
    addFrame,
    updateFrame,
    updateElement,
    addElement,
    deleteFrame,
    duplicateFrame,
    tool,
    setTool,
    selectedFrameId,
    selectedElementId,
    selectedElementIds,
    setPath,
    setCurrentFrame,
    undo,
    redo,
    canUndo,
    canRedo,
    copyElements,
    paste,
    alignElements,
    groupElements,
    ungroupElement,
  } = usePresentationEditorStore();

  // Helper function to get current slide - define IMMEDIATELY after store hooks
  // This ensures it's available before any useEffect or other code that might reference it
  const getCurrentSlide = useCallback(() => {
    if (!frames || frames.length === 0) {
      return undefined;
    }
    if (currentFrameId) {
      return frames.find(f => f.id === currentFrameId);
    }
    const index = typeof selectedSlide === 'number' && selectedSlide >= 0 && selectedSlide < frames.length 
      ? selectedSlide 
      : 0;
    return frames[index] || frames[0];
  }, [frames, currentFrameId, selectedSlide]);

  const renderSlideBrowser = () => {
    if (viewMode === 'grid') {
      if (!frames || frames.length === 0) {
        return (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 px-6">
            No slides yet. Use the New Slide button below to get started.
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 gap-3 p-4">
          {frames.map((frame, index) => (
            <button
              key={frame.id}
              onClick={() => {
                setSelectedSlide(index);
                setCurrentFrame(frame.id);
              }}
              className={`rounded-2xl border p-3 text-left transition-all hover:shadow-md ${
                selectedSlide === index
                  ? 'border-blue-400 bg-blue-50/60 shadow-inner'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 relative flex items-center justify-center">
                <span className="text-4xl font-black text-slate-300/80">{index + 1}</span>
                <div className="absolute inset-0 border border-white/60 rounded-xl pointer-events-none" />
              </div>
              <div className="mt-3 space-y-1">
                <p className="font-semibold text-slate-900 truncate">
                  {frame.title || `Slide ${index + 1}`}
                </p>
                <p className="text-xs text-slate-500">
                  {(frame.elements?.length || 0)} layers • {Math.round(frame.width || 960)} × {Math.round(frame.height || 540)}
                </p>
              </div>
            </button>
          ))}
        </div>
      );
    }

    return (
      <StoryboardView 
        onSlideSelect={(index) => {
          setSelectedSlide(index);
          if (frames[index]) {
            setCurrentFrame(frames[index].id);
          }
        }}
        selectedSlideIndex={selectedSlide}
      />
    );
  };

  const workspaceModes: Array<{ id: PreviewMode; label: string; icon: LucideIcon }> = [
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'split', label: 'Split', icon: LayoutGrid },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'prezi', label: 'Path', icon: MonitorPlay },
  ];

  const shortcutSections = [
    {
      title: "General",
      shortcuts: [
        { keys: "Cmd + S", description: "Save presentation" },
        { keys: "Cmd + P", description: "Present current slide" },
        { keys: "Cmd + K", description: "Open command palette" },
      ],
    },
    {
      title: "Editing",
      shortcuts: [
        { keys: "Cmd + Z", description: "Undo" },
        { keys: "Cmd + Shift + Z", description: "Redo" },
        { keys: "Cmd + G", description: "Group selection" },
        { keys: "Cmd + Shift + G", description: "Ungroup" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: "Up / Down", description: "Change slides" },
        { keys: "Cmd + +/-", description: "Zoom in/out" },
        { keys: "Space", description: "Pan canvas" },
      ],
    },
  ];

  const savePresentation = async () => {
    try {
      setIsSaving(true);
      // Prepare frames for backend
      const framesToSave = frames.map((frame, index) => ({
        id: frame.id,
        title: frame.title,
        content: null, // Content is stored in elements
        x: frame.position.x,
        y: frame.position.y,
        width: frame.width,
        height: frame.height,
        rotation: frame.rotation,
        scale: frame.scale,
        order: index,
        backgroundColor: frame.backgroundColor,
        borderColor: frame.borderColor,
        elements: frame.elements.map(el => {
          // Create a clean copy of the element without circular references or Fabric objects
          const { fabricObject, ...cleanElement } = el;
          return cleanElement;
        })
      }));

      const res = await fetch(`/api/presentations/${presentationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: presentationTitle,
          frames: framesToSave,
          path: path,
          currentFrameId: currentFrameId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save presentation');
      }

      const now = new Date().toISOString();
      setLastSavedAt(now);

      toast({
        title: "Saved",
        description: "Presentation saved successfully",
      });
    } catch (error) {
      console.error("Error saving presentation:", error);
      toast({
        title: "Error",
        description: "Failed to save presentation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchPresentation = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/presentations/${presentationId}`);
      if (res.ok) {
        const data = await res.json();
        setPresentationTitle(data.presentation?.title || "Untitled Presentation");
        setPresentationStatus((data.presentation?.status || 'draft') as PresentationStatus);
        if (data.presentation?.updatedAt) {
          setLastSavedAt(data.presentation.updatedAt);
        } else {
          setLastSavedAt(new Date().toISOString());
        }
        
        // Load slides from database and convert to frames
        if (data.presentation?.slides && data.presentation.slides.length > 0) {
          // Clear existing frames first by resetting the store
          const store = usePresentationEditorStore.getState();
          // Get a copy of frame IDs to avoid mutation during iteration
          const frameIdsToDelete = [...store.frames.map(f => f.id)];
          frameIdsToDelete.forEach((frameId) => {
            store.deleteFrame(frameId);
          });
          
          // Convert slides to frames and add to store
          const loadedFrames: string[] = [];
          data.presentation.slides.forEach((slide: any, index: number) => {
            const metadata = slide.metadata || {};
            let elements = metadata.elements || [];
            
            // If no elements exist but content exists, create text elements from content
            if (elements.length === 0 && slide.content) {
              const content = slide.content;
              const title = slide.title || `Slide ${index + 1}`;
              
              // Create title element if title exists and is meaningful
              if (title && title !== `Slide ${index + 1}`) {
                elements.push({
                  type: 'text',
                  content: title,
                  position: { x: 50, y: 50 },
                  size: { width: 860, height: 80 },
                  rotation: 0,
                  style: {
                    fontSize: 48,
                    fontFamily: 'Arial',
                    fill: '#000000',
                    fontWeight: 'bold',
                  },
                });
              }
              
              // Create content elements from text (split by newlines)
              const contentLines = content.split('\n').filter((line: string) => line.trim());
              let yOffset = title && title !== `Slide ${index + 1}` ? 150 : 100;
              
              contentLines.forEach((line: string, lineIndex: number) => {
                if (line.trim()) {
                  elements.push({
                    type: 'text',
                    content: line.trim(),
                    position: { x: 50, y: yOffset + (lineIndex * 60) },
                    size: { width: 860, height: 50 },
                    rotation: 0,
                    style: {
                      fontSize: 24,
                      fontFamily: 'Arial',
                      fill: '#000000',
                    },
                  });
                }
              });
              
              // If no lines, create a single text element with the content
              if (contentLines.length === 0 && content) {
                elements.push({
                  type: 'text',
                  content: content.substring(0, 500),
                  position: { x: 50, y: 100 },
                  size: { width: 860, height: 400 },
                  rotation: 0,
                  style: {
                    fontSize: 24,
                    fontFamily: 'Arial',
                    fill: '#000000',
                  },
                });
              }
            }
            
            const frameId = addFrame({
              title: slide.title || `Slide ${index + 1}`,
              position: { x: slide.x || 0, y: slide.y || 0 },
              scale: slide.scale || 1,
              rotation: slide.rotation || 0,
              width: slide.width || 960,
              height: slide.height || 540,
              backgroundColor: slide.backgroundColor || '#ffffff',
              borderColor: slide.borderColor || '#e5e7eb',
            }, slide.id);
            
            loadedFrames.push(frameId);
            
            // Add elements to the frame
            elements.forEach((element: any) => {
              addElement(frameId, {
                type: element.type || 'text',
                position: element.position || { x: 0, y: 0 },
                size: element.size || { width: 200, height: 50 },
                rotation: element.rotation || 0,
                content: element.content || null,
                style: element.style || {},
              });
            });
          });
          
          // Set path from presentation path or use loaded frames order
          if (data.presentation.path && Array.isArray(data.presentation.path) && data.presentation.path.length > 0) {
            setPath(data.presentation.path);
          } else {
            setPath(loadedFrames);
          }
          
          // Set current frame
          if (data.presentation.currentFrameId) {
            setCurrentFrame(data.presentation.currentFrameId);
            const frameIndex = loadedFrames.findIndex(
              (fid) => fid === data.presentation.currentFrameId
            );
            if (frameIndex >= 0) {
              setSelectedSlide(frameIndex);
            } else {
              setSelectedSlide(0);
              setCurrentFrame(loadedFrames[0]);
            }
          } else if (loadedFrames.length > 0) {
            setSelectedSlide(0);
            setCurrentFrame(loadedFrames[0]);
          }
        } else {
          // No slides - create a default one
          const frameId = addFrame({
            title: "Slide 1",
            position: { x: 0, y: 0 },
            scale: 1,
            rotation: 0,
            width: 960,
            height: 540,
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
          });
          setPath([frameId]);
          setCurrentFrame(frameId);
          setSelectedSlide(0);
        }
      }
    } catch (error) {
      console.error("Error fetching presentation:", error);
      toast({
        title: "Error",
        description: "Failed to load presentation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentation();
  }, [presentationId]);

  const handleAddSlide = () => {
    const frameId = addFrame({
      title: `Slide ${frames.length + 1}`,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      width: 960,
      height: 540,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    });
    setSelectedSlide(frames.length);
    goToFrame(frameId);
  };

  const handleSlideClick = (index: number) => {
    if (frames[index]) {
      const frame = frames[index];
      console.log('Slide clicked:', { index, frameId: frame.id, elementsCount: frame.elements?.length || 0 });
      setSelectedSlide(index);
      setCurrentFrame(frame.id);
      goToFrame(frame.id);
      // Ensure select tool is active for editing
      setTool("select");
      // Ensure the slide is loaded and editable
      toast({
        title: "Slide Selected",
        description: `Editing slide ${index + 1}`,
      });
    }
  };

  // Sync selectedSlide with currentFrameId from store
  useEffect(() => {
    if (currentFrameId && frames.length > 0) {
      const frameIndex = frames.findIndex(f => f.id === currentFrameId);
      if (frameIndex >= 0 && frameIndex !== selectedSlide) {
        setSelectedSlide(frameIndex);
      } else if (frameIndex < 0 && frames.length > 0) {
        // If currentFrameId doesn't match any frame, select first frame
        setSelectedSlide(0);
        setCurrentFrame(frames[0].id);
      }
    } else if (!currentFrameId && frames.length > 0) {
      // If no currentFrameId but we have frames, select first one
      setSelectedSlide(0);
      setCurrentFrame(frames[0].id);
    }
  }, [currentFrameId, frames, selectedSlide, setCurrentFrame]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs or text editor
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement)?.closest('.tiptap')) {
        return;
      }

      // Get current slide inside the handler to avoid closure issues
      const slide = currentFrameId 
        ? frames.find(f => f.id === currentFrameId) 
        : (frames[selectedSlide] || frames[0]);

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
          toast({
            title: "Undone",
            description: "Last action undone",
          });
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo()) {
          redo();
          toast({
            title: "Redone",
            description: "Action redone",
          });
        }
      }
      // Ctrl/Cmd + C for copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && slide) {
        e.preventDefault();
        const elementIds = selectedElementIds && selectedElementIds.length > 0 
          ? selectedElementIds 
          : selectedElementId 
            ? [selectedElementId] 
            : [];
        if (elementIds.length > 0) {
          copyElements(slide.id, elementIds);
          toast({
            title: "Copied",
            description: `${elementIds.length} object${elementIds.length > 1 ? 's' : ''} copied`,
          });
        }
      }
      
      // Group (Ctrl+G)
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey && selectedElementIds && selectedElementIds.length >= 2 && slide) {
        e.preventDefault();
        const groupId = groupElements(slide.id, selectedElementIds);
        if (groupId) {
          toast({
            title: "Grouped",
            description: `${selectedElementIds.length} objects grouped`,
          });
        }
      }
      
      // Ungroup (Ctrl+Shift+G)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G' && selectedElementId && slide) {
        e.preventDefault();
        const currentSlide = getCurrentSlide();
        const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId);
        if (selectedElement && (selectedElement.style as any)?.groupedElements) {
          ungroupElement(slide.id, selectedElementId);
          toast({
            title: "Ungrouped",
            description: "Group has been ungrouped",
          });
        }
      }
      // Ctrl/Cmd + V for paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        const currentSlide = getCurrentSlide();
        if (currentSlide) {
          paste({ x: 20, y: 20 });
          toast({
            title: "Pasted",
            description: "Object pasted",
          });
        } else {
          toast({
            title: "Error",
            description: "No slide selected for pasting",
            variant: "destructive",
          });
        }
      }
      // Delete key
      if (e.key === 'Delete' && selectedElementId && slide) {
        e.preventDefault();
        const { deleteElement, selectElement } = usePresentationEditorStore.getState();
        deleteElement(slide.id, selectedElementId);
        selectElement(slide.id, null);
        toast({
          title: "Deleted",
          description: "Object deleted",
        });
      }
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger save
        savePresentation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, currentFrameId, frames, selectedSlide, undo, redo, canUndo, canRedo, copyElements, paste, toast]);
  
  // Debug: Log current slide state
  useEffect(() => {
    const slide = currentFrameId 
      ? frames.find(f => f.id === currentFrameId) 
      : (frames[selectedSlide] || frames[0]);
    
    if (slide) {
      console.log('Current slide state:', {
        id: slide.id,
        title: slide.title,
        elementsCount: slide.elements?.length || 0,
        currentFrameId,
        selectedSlide,
        allFrames: frames.map(f => ({ id: f.id, title: f.title, elementsCount: f.elements?.length || 0 }))
      });
    } else {
      console.log('No current slide found', { currentFrameId, selectedSlide, framesCount: frames.length });
    }
  }, [currentFrameId, selectedSlide, frames]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-medium">Loading presentation...</p>
        </div>
      </div>
    );
  }

  const currentSlide = getCurrentSlide();

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* 1. Top Navigation Bar - Premium Design */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="h-8 w-px bg-slate-200" />
          
          {/* Editable Title */}
          <div className="flex-1 min-w-0">
            <Input
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              className="h-9 border-0 bg-transparent font-semibold text-lg px-2 focus:bg-slate-50 focus:ring-2 focus:ring-blue-500 transition-all rounded truncate"
              placeholder="Untitled Presentation"
            />
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
              <Badge className={`${statusStyles[presentationStatus]} font-semibold`}>{statusLabels[presentationStatus]}</Badge>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-slate-400" />
                {lastSavedLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center gap-1 pr-3 border-r border-slate-200">
            {collaborators.map((collab, index) => (
              <div
                key={`${collab.initials}-${index}`}
                className={`${collab.color} h-8 w-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shadow-sm -ml-1 first:ml-0 border-2 border-white`}
              >
                {collab.initials}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-8 px-3 rounded-lg"
            >
              Invite
            </Button>
          </div>

          {/* Undo/Redo Group */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { if (canUndo()) undo(); }}
              disabled={!canUndo()}
              className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 rounded transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </Button>
            <div className="h-5 w-px bg-slate-300" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { if (canRedo()) redo(); }}
              disabled={!canRedo()}
              className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 rounded transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo size={16} />
            </Button>
          </div>

          <div className="h-8 w-px bg-slate-200" />
          
          {/* Action Buttons */}
          <Button 
            variant="ghost"
            size="sm" 
            className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 rounded-lg transition-colors"
            onClick={savePresentation}
            title="Save presentation (Ctrl+S)"
          >
            <Save size={16} />
            <span className="hidden sm:inline font-medium">Save</span>
          </Button>
          
          <Button 
            variant="ghost"
            size="sm" 
            className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 rounded-lg transition-colors"
            title="Share with others"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline font-medium">Share</span>
          </Button>
          
          <Button 
            size="sm" 
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 h-9 rounded-lg shadow-sm font-medium transition-all hover:shadow-md"
            onClick={() => setPreviewMode('preview')}
            title="Start presentation (F5)"
          >
            <Play size={16} />
            <span className="hidden sm:inline">Present</span>
          </Button>

          <div className="h-8 w-px bg-slate-200" />
          
          <HamburgerMenu 
            onSave={savePresentation}
            onExportPDF={() => toast({ title: "Exporting PDF", description: "Your PDF is being generated..." })}
            onExportPPTX={() => toast({ title: "Exporting PPTX", description: "Your PowerPoint is being generated..." })}
            onShare={() => toast({ title: "Share", description: "Sharing link copied to clipboard" })}
            onCollaborate={() => toast({ title: "Collaborate", description: "Collaboration invite sent" })}
            onPresent={() => setPreviewMode('preview')}
          />
        </div>
      </header>

      {/* 2. Toolbar - Professional Design */}
      <div className="h-14 border-b border-slate-200 flex items-center px-6 gap-2 bg-white shrink-0 overflow-x-auto">
        {/* Selection Tools */}
        <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
          <Button
            variant={tool === "select" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("select")}
            className={`gap-2 h-9 rounded-lg transition-all ${
              tool === "select" 
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Select tool (V)"
          >
            <MousePointer2 size={16} />
            <span className="hidden lg:inline font-medium text-sm">Select</span>
          </Button>
        </div>

        {/* Content Tools */}
        <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
          <Button
            variant={tool === "text" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("text")}
            className={`gap-2 h-9 rounded-lg transition-all ${
              tool === "text" 
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Add text (T)"
          >
            <TypeIcon size={16} />
            <span className="hidden lg:inline font-medium text-sm">Text</span>
          </Button>
          
          <Button
            variant={tool === "image" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("image")}
            className={`gap-2 h-9 rounded-lg transition-all ${
              tool === "image" 
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
            title="Add image"
          >
            <ImageIcon2 size={16} />
            <span className="hidden lg:inline font-medium text-sm">Image</span>
          </Button>
          
          <div className="relative" data-shape-selector>
            <Button
              variant={tool === "shape" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                if (tool === "shape") {
                  setShowShapeSelector(!showShapeSelector);
                } else {
                  setTool("shape");
                  setShowShapeSelector(true);
                }
              }}
              className={`gap-2 h-9 rounded-lg transition-all ${
                tool === "shape" 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Add shape"
            >
              <Square size={16} />
              <span className="hidden lg:inline font-medium text-sm">Shape</span>
              <ChevronDown size={12} className="opacity-60" />
            </Button>
            
            {showShapeSelector && tool === "shape" && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-lg shadow-xl z-50 grid grid-cols-3 gap-2 min-w-[200px]">
                {['rect', 'circle', 'triangle', 'ellipse', 'line', 'arrow'].map((shape) => (
                  <button
                    key={shape}
                    onClick={() => {
                      setSelectedShapeType(shape);
                      setShowShapeSelector(false);
                    }}
                    className={`p-3 rounded-lg hover:bg-slate-100 flex flex-col items-center gap-2 transition-all border ${
                      selectedShapeType === shape 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 border-2 border-current rounded-sm" />
                    <span className="text-xs font-medium capitalize text-slate-700">{shape}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Data Tools */}
        <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChartDialog(true)}
            className="gap-2 h-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
            title="Insert chart"
          >
            <BarChart3 size={16} />
            <span className="hidden lg:inline font-medium text-sm">Chart</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTableDialog(true)}
            className="gap-2 h-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
            title="Insert table"
          >
            <Table size={16} />
            <span className="hidden lg:inline font-medium text-sm">Table</span>
          </Button>
        </div>

        <div className="flex-1" />
        
        {/* AI + View Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {workspaceModes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPreviewMode(id)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  previewMode === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon size={14} />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 rounded-lg"
            onClick={() => setIsShortcutsOpen(true)}
          >
            <HelpCircle size={16} />
            <span className="hidden lg:inline text-sm">Shortcuts</span>
          </Button>

          <div className="flex-shrink-0">
            <AIPresentationGenerator />
          </div>
        </div>
      </div>

      {/* 3. Main Workspace - Clean Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Slide Thumbnails */}
        <div className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0 shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Slides</h3>
              <p className="text-xs text-slate-500 mt-1">{frames.length} slide{frames.length !== 1 ? 's' : ''}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
            >
              {viewMode === 'list' ? <Grid3x3 size={16} /> : <List size={16} />}
            </Button>
          </div>

          {/* Slide List */}
          <div className="flex-1 overflow-y-auto">
            {renderSlideBrowser()}
          </div>

          {/* Add Slide Button */}
          <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <Button 
              className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm hover:shadow-md transition-all h-10" 
              onClick={() => {
                const newId = addFrame({
                  title: `Slide ${frames.length + 1}`,
                  position: { x: 0, y: 0 },
                  scale: 1,
                  rotation: 0,
                  width: 960,
                  height: 540,
                  backgroundColor: '#ffffff',
                });
                setCurrentFrame(newId);
                setSelectedSlide(frames.length);
              }}
            >
              <Plus size={18} />
              <span className="font-semibold">New Slide</span>
            </Button>
          </div>
        </div>

        {/* Center: Canvas Area */}
        <div className="flex-1 bg-gradient-to-b from-slate-100 to-slate-50 relative overflow-hidden flex flex-col">
          {/* Canvas Container */}
          <div className="flex-1 overflow-auto relative flex items-center justify-center p-8">
            {previewMode === 'preview' && currentSlide ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <PresentationPreviewPanel
                  frameId={currentSlide.id}
                  width={960}
                  height={540}
                  mode="fullscreen"
                  onClose={() => setPreviewMode('edit')}
                />
              </div>
            ) : previewMode === 'split' && currentSlide ? (
              <div className="grid w-full max-w-[1400px] grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="relative shadow-2xl ring-1 ring-black/10 rounded-xl overflow-hidden bg-white shrink-0 hover:shadow-3xl transition-shadow">
                  <EnhancedWYSIWYGCanvas
                    frameId={currentSlide.id}
                    width={960}
                    height={540}
                    selectedShapeType={selectedShapeType}
                  />
                  <ContextToolbar />
                </div>
                <div className="relative rounded-xl border border-slate-200 bg-white/80 p-6 shadow-inner">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Live Preview</p>
                      <p className="text-xs text-slate-500">Shows exactly what attendees will see</p>
                    </div>
                    <Badge className="bg-slate-900 text-white">Realtime</Badge>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-900 p-3">
                    <PresentationPreviewPanel frameId={currentSlide.id} width={640} height={360} mode="panel" />
                  </div>
                </div>
              </div>
            ) : previewMode === 'prezi' ? (
              <div className="w-full h-full max-w-5xl">
                <PreziCanvasView
                  width={1200}
                  height={700}
                  mode="edit"
                  onFrameSelect={(frameId) => {
                    const index = frames.findIndex((f) => f.id === frameId);
                    if (index !== -1) {
                      setSelectedSlide(index);
                      setCurrentFrame(frameId);
                      setPreviewMode('edit');
                    }
                  }}
                />
              </div>
            ) : currentSlide ? (
              <div className="relative shadow-2xl ring-1 ring-black/10 rounded-xl overflow-hidden bg-white shrink-0 hover:shadow-3xl transition-shadow">
                <EnhancedWYSIWYGCanvas
                  frameId={currentSlide.id}
                  width={960}
                  height={540}
                  selectedShapeType={selectedShapeType}
                />
                <ContextToolbar />
              </div>
            ) : (
              <div className="text-center">
                <LayoutTemplate className="w-24 h-24 mx-auto mb-6 text-slate-300" />
                <p className="text-slate-500 font-medium">No slide selected</p>
                <p className="text-slate-400 text-sm mt-1">Select or create a slide to begin editing</p>
              </div>
            )}
          </div>
          
          {/* Bottom Status Bar */}
          <div className="h-10 border-t border-slate-200 bg-white flex items-center justify-between px-6 text-xs text-slate-600 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-900">
                Slide <span className="text-blue-600">{selectedSlide + 1}</span>
                <span className="text-slate-400 font-normal"> of {frames.length}</span>
              </span>
              <div className="h-4 w-px bg-slate-300" />
              <span className="text-slate-700 font-medium truncate max-w-xs" title={currentSlide?.title}>
                {currentSlide?.title || "Untitled Slide"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </Button>
              <span className="w-10 text-center font-semibold text-slate-900">100%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </Button>
              <div className="h-4 w-px bg-slate-300" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                title="Fit to screen"
              >
                <Maximize2 size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Properties Panel */}
        <div className="w-[21rem] border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Properties</h3>
              <p className="text-[11px] text-slate-500">Element styles, layout, and animations</p>
            </div>
            <Badge className="bg-slate-900/5 text-slate-600 border border-slate-200 text-[10px]">
              Cmd + .
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto">
            {currentSlide ? (
              <PropertiesPanel frameId={currentSlide.id} />
            ) : (
              <div className="p-6 text-center text-slate-500">
                <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">Select an element</p>
                <p className="text-xs mt-2">Properties will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ChartDialog
        open={showChartDialog}
        onOpenChange={setShowChartDialog}
        onInsert={(chartData) => {
          const currentSlide = getCurrentSlide();
          if (currentSlide) {
            addElement(currentSlide.id, {
              type: "chart",
              position: { x: 100, y: 100 },
              size: { width: chartData.width, height: chartData.height },
              rotation: 0,
              content: JSON.stringify(chartData),
              style: {},
            });
          }
        }}
      />

      <TableDialog
        open={showTableDialog}
        onOpenChange={setShowTableDialog}
        onInsert={(tableData) => {
          const currentSlide = getCurrentSlide();
          if (currentSlide) {
            addElement(currentSlide.id, {
              type: "table",
              position: { x: 100, y: 100 },
              size: { width: tableData.width, height: tableData.height },
              rotation: 0,
              content: JSON.stringify(tableData),
              style: {},
            });
          }
        }}
      />

      <Dialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Stay in the flow with these frequently used commands.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {shortcutSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{section.title}</h4>
                <div className="space-y-2">
                  {section.shortcuts.map((shortcut) => (
                    <div
                      key={`${section.title}-${shortcut.keys}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-600">{shortcut.description}</span>
                      <span className="font-mono text-xs text-slate-900 bg-white border border-slate-200 rounded px-2 py-0.5">
                        {shortcut.keys}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-right">
            <Button variant="secondary" onClick={() => setIsShortcutsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
