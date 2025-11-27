"use client";

import { useEffect, useRef, useState } from "react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OverviewWindow() {
  const {
    frames,
    path,
    overviewMode,
    setOverviewMode,
    goToFrame,
    selectedFrameId,
  } = usePresentationEditorStore();

  const [isMinimized, setIsMinimized] = useState(true); // Start minimized
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 700 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const hasPositionedRef = useRef(false);

  // Position at bottom right when overview mode opens
  useEffect(() => {
    if (overviewMode && !hasPositionedRef.current) {
      // When minimized, we use CSS right/bottom, so no need to calculate position
      // When expanded, position at bottom right
      if (!isMinimized) {
        const padding = 20;
        const bottomRightX = window.innerWidth - dimensions.width - padding;
        const bottomRightY = window.innerHeight - (dimensions.height + 40) - padding;
        setPosition({ x: bottomRightX, y: bottomRightY });
      }
      hasPositionedRef.current = true;
    } else if (!overviewMode) {
      hasPositionedRef.current = false;
    }
  }, [overviewMode, dimensions.width, dimensions.height]);
  
  // Update position when minimized state changes
  useEffect(() => {
    if (overviewMode && !isMinimized) {
      const padding = 20;
      const bottomRightX = window.innerWidth - dimensions.width - padding;
      const bottomRightY = window.innerHeight - (dimensions.height + 40) - padding;
      setPosition({ x: bottomRightX, y: bottomRightY });
    }
  }, [isMinimized, overviewMode, dimensions.width, dimensions.height]);

  // Organize frames into sections
  const selectedFrame = selectedFrameId ? frames.find((f) => f.id === selectedFrameId) : null;
  const framesInPath = frames.filter((f) => path.includes(f.id));
  const otherFrames = frames.filter((f) => !path.includes(f.id) && f.id !== selectedFrameId);

  // Sort frames in path by their path order
  const sortedFramesInPath = framesInPath.sort((a, b) => {
    const indexA = path.indexOf(a.id);
    const indexB = path.indexOf(b.id);
    return indexA - indexB;
  });

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.overview-header')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      setDimensions({
        width: Math.max(500, resizeStartRef.current.width + deltaX),
        height: Math.max(400, resizeStartRef.current.height + deltaY),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handle frame click
  const handleFrameClick = (frameId: string) => {
    setOverviewMode(false);
    setTimeout(() => {
      goToFrame(frameId);
    }, 100);
  };

  // Render frame item
  const renderFrameItem = (frame: typeof frames[0], index?: number) => {
    const isSelected = selectedFrameId === frame.id;
    const pathIndex = path.indexOf(frame.id);

    return (
      <div
        key={frame.id}
        onClick={() => handleFrameClick(frame.id)}
        className={`
          group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
          ${isSelected 
            ? "bg-blue-600/20 border border-blue-500/50" 
            : "bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50 hover:border-gray-600/50"
          }
        `}
      >
        <div className={`
          flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-sm font-semibold
          ${isSelected 
            ? "bg-blue-600 text-white" 
            : pathIndex >= 0
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : "bg-gray-700/50 text-gray-300"
          }
        `}>
          {pathIndex >= 0 ? pathIndex + 1 : index !== undefined ? index + 1 : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-200 truncate">
            {frame.title || `Frame ${index !== undefined ? index + 1 : ""}`}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {Math.round(frame.width)} × {Math.round(frame.height)}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0" />
      </div>
    );
  };

  if (!overviewMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-800/60 rounded-xl shadow-2xl"
        style={{
          right: isMinimized ? "20px" : "auto",
          bottom: isMinimized ? "20px" : "auto",
          left: isMinimized ? "auto" : `${position.x}px`,
          top: isMinimized ? "auto" : `${position.y}px`,
          width: isMinimized ? "300px" : `${dimensions.width}px`,
          height: isMinimized ? "auto" : `${dimensions.height + 40}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className={`overview-header flex items-center justify-between cursor-move ${isMinimized ? 'p-2.5' : 'p-3 border-b border-gray-800/60'}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-semibold text-gray-200">Overview</span>
            {!isMinimized && (
              <span className="text-xs text-gray-400">({frames.length} slides)</span>
            )}
            {isMinimized && (
              <span className="text-xs text-gray-400 ml-1">({frames.length})</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentlyMinimized = isMinimized;
                setIsMinimized(!isMinimized);
                // Reposition when expanding (not when minimizing)
                if (currentlyMinimized) {
                  // Expanding - position at bottom right
                  setTimeout(() => {
                    const padding = 20;
                    const bottomRightX = window.innerWidth - dimensions.width - padding;
                    const bottomRightY = window.innerHeight - (dimensions.height + 40) - padding;
                    setPosition({ x: bottomRightX, y: bottomRightY });
                  }, 0);
                }
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOverviewMode(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="relative" style={{ height: `${dimensions.height}px` }}>
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {/* Selected Frame */}
                {selectedFrame && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-200">Selected</h3>
                    </div>
                    {renderFrameItem(selectedFrame)}
                  </div>
                )}

                {/* Frames In Path */}
                {sortedFramesInPath.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-200">
                        In Path ({sortedFramesInPath.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {sortedFramesInPath.map((frame) => renderFrameItem(frame))}
                    </div>
                  </div>
                )}

                {/* Other Frames */}
                {otherFrames.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                      <h3 className="text-sm font-semibold text-gray-200">
                        Other Frames ({otherFrames.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {otherFrames.map((frame, index) => renderFrameItem(frame, index))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {frames.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No frames yet</p>
                    <p className="text-xs mt-1">Create frames to see them here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gray-800/50 hover:bg-gray-700/50 rounded-tl-lg"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-500"></div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

