"use client";

import { useState } from "react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Square, Plus, Monitor, Tablet, Smartphone, Settings, Search, Lock, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FrameNavigator() {
  const {
    frames,
    path,
    selectedFrameId,
    goToFrame,
    currentFrameId,
    selectFrame,
    setSelectionMode,
    setTool,
    canvas,
    addFrame,
    zoom,
    panX,
    panY,
    zoomToFrame,
  } = usePresentationEditorStore();
  
  const [searchQuery, setSearchQuery] = useState("");

  const pathFrames = path
    .map((id) => frames.find((f) => f.id === id))
    .filter((f) => f !== undefined);
  
  // Filter frames by search query
  const filteredPathFrames = pathFrames.filter((frame) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      frame.title?.toLowerCase().includes(query) ||
      frame.id.toLowerCase().includes(query)
    );
  });
  
  const filteredOtherFrames = frames
    .filter((f) => !path.includes(f.id))
    .filter((frame) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        frame.title?.toLowerCase().includes(query) ||
        frame.id.toLowerCase().includes(query)
      );
    });

  const handleFrameClick = (frameId: string) => {
    setSelectionMode('external');
    goToFrame(frameId);
  };

  const frameTemplates = [
    { name: 'Standard (16:9)', width: 640, height: 360, icon: Monitor },
    { name: 'Widescreen (21:9)', width: 840, height: 360, icon: Monitor },
    { name: 'Square', width: 400, height: 400, icon: Square },
    { name: 'Portrait (9:16)', width: 360, height: 640, icon: Smartphone },
    { name: 'Tablet (4:3)', width: 600, height: 450, icon: Tablet },
  ];

  const handleAddSlide = (template?: { width: number; height: number }) => {
    // Add a new frame at a reasonable position with smart spacing
    const centerX = canvas ? (canvas.getWidth() / 2 - panX) / zoom : 500;
    const centerY = canvas ? (canvas.getHeight() / 2 - panY) / zoom : 500;
    
    const frameWidth = template?.width || 640;
    const frameHeight = template?.height || 360;
    
    // Snap to 40px grid for neat organization
    const GRID_SIZE = 40;
    const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;
    
    // Calculate position with spacing from existing frames
    let newX = centerX - frameWidth / 2;
    let newY = centerY - frameHeight / 2;
    
    // If there are existing frames, position new frame with spacing
    if (frames.length > 0) {
      const spacing = 100; // Space between frames
      const lastFrame = frames[frames.length - 1];
      newX = snapToGrid(lastFrame.position.x + lastFrame.width + spacing);
      newY = snapToGrid(lastFrame.position.y);
      
      // If frame would be too far right, wrap to next row
      const maxX = centerX + 2000;
      if (newX > maxX) {
        newX = snapToGrid(centerX - 1000);
        newY = snapToGrid(lastFrame.position.y + lastFrame.height + spacing);
      }
    } else {
      // First frame: center it and snap to grid
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);
    }
    
    const frameId = addFrame({
      title: `Slide ${frames.length + 1}`,
      position: { x: newX, y: newY },
      scale: 1,
      rotation: 0,
      width: frameWidth,
      height: frameHeight,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    });

    // Select and zoom to the new frame
    setTimeout(() => {
      goToFrame(frameId);
    }, 100);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-900 backdrop-blur-xl border-r border-gray-800/60 flex flex-col shadow-2xl">
      {/* Header Section */}
      <div className="p-5 border-b border-gray-800/70 space-y-4 bg-gradient-to-b from-gray-900/95 to-gray-900/80 flex-shrink-0 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white tracking-tight mb-1">Storyboard</h3>
            <p className="text-xs text-gray-400 font-medium">
              {frames.length} {frames.length === 1 ? 'slide' : 'slides'} total
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold border-blue-500/40 bg-blue-500/10 text-blue-300 flex-shrink-0 px-2.5 py-1">
            {frames.length}
          </Badge>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search slides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Add Slide Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 border-0 font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-gray-800/95 backdrop-blur-xl border-gray-700/80 shadow-xl">
            <DropdownMenuItem
              onClick={() => handleAddSlide()}
              className="text-gray-200 hover:bg-gray-700/80 hover:text-white cursor-pointer focus:bg-gray-700/80 transition-colors"
            >
              <Square className="w-4 h-4 mr-2.5 text-gray-400" />
              <span className="font-medium">Custom Size</span>
              <span className="ml-auto text-xs text-gray-500">Drag to create</span>
            </DropdownMenuItem>
            <div className="h-px bg-gray-700/60 my-1.5 mx-2" />
            {frameTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <DropdownMenuItem
                  key={template.name}
                  onClick={() => handleAddSlide(template)}
                  className="text-gray-200 hover:bg-gray-700/80 hover:text-white cursor-pointer focus:bg-gray-700/80 transition-colors"
                >
                  <Icon className="w-4 h-4 mr-2.5 text-gray-400" />
                  <span className="font-medium">{template.name}</span>
                  <span className="ml-auto text-xs text-gray-500 font-mono">
                    {template.width}×{template.height}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Stats Bar */}
        {frames.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-700/60 bg-gray-900/40 px-4 py-5 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gray-800/60 flex items-center justify-center mb-1">
                <Square className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Click "Add Slide" above or use the <span className="text-gray-300 font-semibold">Frame tool (F)</span> to create your first slide.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 text-xs bg-gray-800/40 backdrop-blur-sm px-3.5 py-2.5 rounded-lg border border-gray-800/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
              <span className="text-gray-300 font-semibold uppercase tracking-wider text-[10px]">Path</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">{path.length}</span>
                <span className="text-gray-500 font-medium">in path</span>
              </div>
              <div className="w-px h-4 bg-gray-700/60"></div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">{frames.length - path.length}</span>
                <span className="text-gray-500 font-medium">spare</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {pathFrames.length > 0 && (
            <>
              <div className="flex items-center gap-2.5 px-2 py-2.5 mb-1">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 via-blue-500 to-blue-600 rounded-full shadow-sm shadow-blue-500/30"></div>
                <div className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                  Presentation Path
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-blue-500/30 bg-blue-500/10 text-blue-300 font-semibold">
                    {pathFrames.length}
                  </Badge>
                </div>
              </div>
              {filteredPathFrames.map((frame, index) => {
                const originalIndex = pathFrames.indexOf(frame);
                return (
                <div
                  key={frame.id}
                  onClick={() => handleFrameClick(frame.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group cursor-pointer backdrop-blur-sm ${
                    selectedFrameId === frame.id
                      ? "bg-gradient-to-br from-blue-600/25 to-blue-500/15 border-blue-500/60 text-white shadow-xl shadow-blue-500/20 scale-[1.02]"
                      : currentFrameId === frame.id
                      ? "bg-gradient-to-br from-green-600/25 to-green-500/15 border-green-500/60 text-white shadow-lg shadow-green-500/10"
                      : "bg-gray-800/50 border-gray-700/60 text-gray-300 hover:bg-gray-800/70 hover:border-gray-600/80 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                          selectedFrameId === frame.id
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/40"
                            : currentFrameId === frame.id
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/40"
                            : "bg-gray-700/80 text-gray-300 group-hover:bg-gray-600/90"
                        }`}
                      >
                        {originalIndex + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Square className={`w-3.5 h-3.5 flex-shrink-0 ${
                          selectedFrameId === frame.id
                            ? "text-blue-400"
                            : currentFrameId === frame.id
                            ? "text-green-400"
                            : "text-gray-500"
                        }`} />
                        <span className="text-sm font-semibold truncate text-white">
                          {frame.title || `Slide ${originalIndex + 1}`}
                        </span>
                        {frame.locked && (
                          <Lock className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                        )}
                        {currentFrameId === frame.id && (
                          <MapPin className="w-3.5 h-3.5 text-green-400 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-gray-400 font-medium">
                        <span className="font-mono">{Math.round(frame.width)} × {Math.round(frame.height)}</span>
                        {frame.elements.length > 0 && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-500">{frame.elements.length} {frame.elements.length === 1 ? 'element' : 'elements'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3.5 grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-blue-600/25 border border-blue-500/50 text-blue-100 hover:bg-blue-600/35 hover:border-blue-400/60 text-xs font-medium h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFrameClick(frame.id);
                      }}
                    >
                      Focus
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-gray-700/70 border border-gray-700/60 hover:border-gray-600/80 text-xs font-medium h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectionMode('canvas');
                        selectFrame(frame.id);
                        // Ensure frame is visible on canvas
                        zoomToFrame(frame.id, true);
                      }}
                    >
                      Select
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-gray-700/70 border border-gray-700/60 hover:border-gray-600/80 text-xs font-medium h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof window !== 'undefined') {
                          const event = new CustomEvent('openFrameProperties', { detail: { frameId: frame.id } });
                          window.dispatchEvent(event);
                        }
                      }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
              })}
            </>
          )}

          {filteredOtherFrames.length > 0 && (
            <>
              <div className="flex items-center gap-2.5 px-2 py-2.5 mt-2 mb-1">
                <div className="w-1 h-5 bg-gradient-to-b from-gray-600 via-gray-600 to-gray-700 rounded-full"></div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Other Frames
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-gray-700/50 bg-gray-800/50 text-gray-400 font-semibold">
                    {filteredOtherFrames.length}
                  </Badge>
                </div>
              </div>
              {filteredOtherFrames.map((frame, index) => {
                  const frameIndex = frames.indexOf(frame);
                  return (
                    <div
                      key={frame.id}
                      onClick={() => handleFrameClick(frame.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group cursor-pointer backdrop-blur-sm ${
                        selectedFrameId === frame.id
                          ? "bg-gradient-to-br from-blue-600/25 to-blue-500/15 border-blue-500/60 text-white shadow-xl shadow-blue-500/20 scale-[1.02]"
                          : "bg-gray-800/50 border-gray-700/60 text-gray-300 hover:bg-gray-800/70 hover:border-gray-600/80 hover:shadow-lg"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                              selectedFrameId === frame.id
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/40"
                                : "bg-gray-700/80 text-gray-300 group-hover:bg-gray-600/90"
                            }`}
                          >
                            {frameIndex + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Square className={`w-3.5 h-3.5 flex-shrink-0 ${
                              selectedFrameId === frame.id
                                ? "text-blue-400"
                                : "text-gray-500"
                            }`} />
                            <span className="text-sm font-semibold truncate text-white">
                              {frame.title || `Frame ${frameIndex + 1}`}
                            </span>
                            {frame.locked && (
                              <Lock className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-400 font-medium">
                            <span className="font-mono">{Math.round(frame.width)} × {Math.round(frame.height)}</span>
                            {frame.elements.length > 0 && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-500">{frame.elements.length} {frame.elements.length === 1 ? 'element' : 'elements'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3.5 grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-blue-600/25 border border-blue-500/50 text-blue-100 hover:bg-blue-600/35 hover:border-blue-400/60 text-xs font-medium h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFrameClick(frame.id);
                          }}
                        >
                          Focus
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-300 hover:text-white hover:bg-gray-700/70 border border-gray-700/60 hover:border-gray-600/80 text-xs font-medium h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectionMode('canvas');
                            selectFrame(frame.id);
                          }}
                        >
                          Select
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-300 hover:text-white hover:bg-gray-700/70 border border-gray-700/60 hover:border-gray-600/80 text-xs font-medium h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof window !== 'undefined') {
                              const event = new CustomEvent('openFrameProperties', { detail: { frameId: frame.id } });
                              window.dispatchEvent(event);
                            }
                          }}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </ScrollArea>

      {path.length > 1 && (
        <div className="p-4 border-t border-gray-800/70 bg-gradient-to-b from-gray-900/80 to-gray-900 flex items-center justify-between backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = path.indexOf(currentFrameId || "");
              if (currentIndex > 0) {
                goToFrame(path[currentIndex - 1]);
              }
            }}
            disabled={!currentFrameId || path.indexOf(currentFrameId || "") === 0}
            className="text-gray-300 hover:text-white hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">
              {path.indexOf(currentFrameId || "") + 1 || 0}
            </span>
            <span className="text-xs text-gray-600">/</span>
            <span className="text-xs font-semibold text-gray-400">
              {path.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentIndex = path.indexOf(currentFrameId || "");
              if (currentIndex < path.length - 1) {
                goToFrame(path[currentIndex + 1]);
              }
            }}
            disabled={
              !currentFrameId || path.indexOf(currentFrameId || "") === path.length - 1
            }
            className="text-gray-300 hover:text-white hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

