"use client";

import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Square,
  Type,
  Image as ImageIcon,
  Video,
  Circle,
  Triangle,
  Route,
  Play,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  MoreVertical,
  Eye,
  Sparkles,
  BookOpen,
  Calendar,
  Brain,
  Users,
  Zap,
} from "lucide-react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Separator } from "@/components/ui/separator";

interface ToolbarProps {
  onPathEditorOpen?: () => void;
  onStartPresentation?: () => void;
  onTemplatesOpen?: () => void;
  onScriptureOpen?: () => void;
  onServicePlannerOpen?: () => void;
  onAIAssistantOpen?: () => void;
  onCollaborationOpen?: () => void;
  onAnimationsOpen?: () => void;
  onSmartSuggestionsOpen?: () => void;
}

export function Toolbar({ onPathEditorOpen, onStartPresentation, onTemplatesOpen, onScriptureOpen, onServicePlannerOpen, onAIAssistantOpen, onCollaborationOpen, onAnimationsOpen, onSmartSuggestionsOpen }: ToolbarProps) {
  const { 
    tool, 
    setTool, 
    zoom, 
    setZoom, 
    canvas, 
    goToFrame, 
    currentFrameId, 
    path, 
    frames, 
    fitCanvasToFrames,
    undo,
    redo,
    canUndo,
    canRedo,
    duplicateFrame,
    selectedFrameId,
    selectedFrameIds,
    zoomToSelection,
    alignFrames,
    distributeFrames,
  } = usePresentationEditorStore();

  const handleZoomIn = () => {
    if (canvas) {
      const newZoom = Math.min(5, zoom * 1.2);
      canvas.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (canvas) {
      const newZoom = Math.max(0.1, zoom / 1.2);
      canvas.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleFitToScreen = () => {
    if (canvas && currentFrameId) {
      goToFrame(currentFrameId);
    } else if (frames.length > 0) {
      fitCanvasToFrames();
    }
  };

  return (
    <div className="flex items-center gap-2 px-2">
      {/* Selection Tools */}
      <div className="flex items-center gap-1.5">
        <Button
          variant={tool === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("select")}
          title="Select (V)"
          className={tool === "select" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
          }
        >
          <MousePointer2 className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === "frame" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("frame")}
          title="Add Slide - Click and drag to create (F)"
          className={tool === "frame" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
          }
        >
          <Square className="w-4 h-4" />
          <span className="ml-1.5 text-xs hidden sm:inline">Add Slide</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-gray-700/50" />

      {/* Church-Specific Tools */}
      {onTemplatesOpen && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTemplatesOpen}
            title="Templates Library"
            className="text-purple-300 hover:text-purple-200 hover:bg-purple-600/20 border border-purple-500/30"
          >
            <Sparkles className="w-4 h-4" />
            <span className="ml-1.5 text-xs hidden sm:inline">Templates</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onScriptureOpen}
            title="Add Scripture Verse"
            className="text-amber-300 hover:text-amber-200 hover:bg-amber-600/20 border border-amber-500/30"
          >
            <BookOpen className="w-4 h-4" />
            <span className="ml-1.5 text-xs hidden sm:inline">Scripture</span>
          </Button>
          {onServicePlannerOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onServicePlannerOpen}
              title="Service Planner"
              className="text-green-300 hover:text-green-200 hover:bg-green-600/20 border border-green-500/30"
            >
              <Calendar className="w-4 h-4" />
              <span className="ml-1.5 text-xs hidden sm:inline">Service</span>
            </Button>
          )}
          <Separator orientation="vertical" className="h-6 bg-gray-700/50" />
        </>
      )}

      {/* Modern Features */}
      {(onAIAssistantOpen || onCollaborationOpen || onAnimationsOpen || onSmartSuggestionsOpen) && (
        <>
          <Separator orientation="vertical" className="h-6 bg-gray-700/50" />
          {onAIAssistantOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAIAssistantOpen}
              title="AI Assistant"
              className="text-purple-300 hover:text-purple-200 hover:bg-purple-600/20 border border-purple-500/30"
            >
              <Brain className="w-4 h-4" />
              <span className="ml-1.5 text-xs hidden sm:inline">AI</span>
            </Button>
          )}
          {onSmartSuggestionsOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSmartSuggestionsOpen}
              title="Smart Suggestions"
              className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-600/20 border border-cyan-500/30"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
          {onCollaborationOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollaborationOpen}
              title="Collaboration"
              className="text-blue-300 hover:text-blue-200 hover:bg-blue-600/20 border border-blue-500/30"
            >
              <Users className="w-4 h-4" />
            </Button>
          )}
          {onAnimationsOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAnimationsOpen}
              title="Animations"
              className="text-yellow-300 hover:text-yellow-200 hover:bg-yellow-600/20 border border-yellow-500/30"
            >
              <Zap className="w-4 h-4" />
            </Button>
          )}
          <Separator orientation="vertical" className="h-6 bg-gray-700/50" />
        </>
      )}

      {/* Element Tools */}
      <div className="flex items-center gap-1.5">
        <Button
          variant={tool === "text" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("text")}
          title="Add Text (T)"
          className={tool === "text" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
          }
        >
          <Type className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === "image" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("image")}
          title="Add Image (I)"
          className={tool === "image" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
          }
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === "shape" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("shape")}
          title="Add Shape (S)"
          className={tool === "shape" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
          }
        >
          <Circle className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === "video" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTool("video")}
          title="Add Video"
          className={tool === "video" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
          }
        >
          <Video className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-gray-700/50" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="text-gray-300 hover:text-white hover:bg-gray-800/50"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-gray-300 min-w-[60px] text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="text-gray-300 hover:text-white hover:bg-gray-800/50"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitToScreen}
          title="Fit to Screen (0)"
          className="text-gray-300 hover:text-white hover:bg-gray-800/50"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 bg-gray-700/50" />

      {/* Align/Distribute Tools - Show when multiple frames selected */}
      {selectedFrameIds.length >= 2 && (
        <>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alignFrames(selectedFrameIds, 'left')}
              title="Align Left"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alignFrames(selectedFrameIds, 'center')}
              title="Align Center"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alignFrames(selectedFrameIds, 'right')}
              title="Align Right"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alignFrames(selectedFrameIds, 'top')}
              title="Align Top"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <AlignVerticalJustifyStart className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alignFrames(selectedFrameIds, 'middle')}
              title="Align Middle"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <AlignVerticalJustifyCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alignFrames(selectedFrameIds, 'bottom')}
              title="Align Bottom"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <AlignVerticalJustifyEnd className="w-4 h-4" />
            </Button>
          </div>
          {selectedFrameIds.length >= 3 && (
            <>
              <Separator orientation="vertical" className="h-6 bg-gray-700" />
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => distributeFrames(selectedFrameIds, 'horizontal')}
                  title="Distribute Horizontally"
                  className="text-gray-300 hover:text-white hover:bg-gray-800/50"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => distributeFrames(selectedFrameIds, 'vertical')}
                  title="Distribute Vertically"
                  className="text-gray-300 hover:text-white hover:bg-gray-800/50"
                >
                  <AlignVerticalJustifyStart className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
          <Separator orientation="vertical" className="h-6 bg-gray-700" />
        </>
      )}

      {/* Path Editor */}
      {onPathEditorOpen && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPathEditorOpen}
            title="Edit Path"
            className="text-gray-300 hover:text-white hover:bg-gray-800/50"
          >
            <Route className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-gray-700" />
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
          className="text-gray-300 hover:text-white hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
          className="text-gray-300 hover:text-white hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo className="w-4 h-4" />
        </Button>
        {selectedFrameId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => duplicateFrame(selectedFrameId)}
            title="Duplicate Frame (Ctrl+D)"
            className="text-gray-300 hover:text-white hover:bg-gray-800/50"
          >
            <Square className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomToSelection}
          title="Zoom to Selection (Z)"
          className="text-gray-300 hover:text-white hover:bg-gray-800/50"
        >
          <Maximize className="w-4 h-4" />
        </Button>
        {onStartPresentation && (
          <Button
            variant="default"
            size="sm"
            onClick={onStartPresentation}
            title="Start Presentation (F5)"
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20"
          >
            <Play className="w-4 h-4 mr-2" />
            Present
          </Button>
        )}
      </div>
    </div>
  );
}

