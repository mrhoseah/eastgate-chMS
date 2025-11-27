"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, Rect, IText, Circle, Image, Triangle, Ellipse, Line, Polygon, Point, type Object as FabricObject, Group } from "fabric";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Home, 
  ChevronLeft, ChevronRight, Play, Pause, Grid3x3,
  Navigation, Route, Eye, EyeOff, Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PreziCanvasViewProps {
  width: number;
  height: number;
  mode?: 'edit' | 'present' | 'overview';
  onFrameSelect?: (frameId: string) => void;
  onAddFrame?: (position: { x: number; y: number }) => void;
  onFrameMove?: (frameId: string, position: { x: number; y: number }) => void;
  onFrameEdit?: (frameId: string) => void;
}

export function PreziCanvasView({ 
  width, 
  height, 
  mode = 'edit',
  onFrameSelect,
  onAddFrame,
  onFrameMove,
  onFrameEdit,
}: PreziCanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [showPath, setShowPath] = useState(true);
  const { toast } = useToast();
  // Animation state
  const animationRef = useRef<number | null>(null);
  const animationState = useRef<{ zoom: number; panX: number; panY: number }>({ zoom, panX, panY });
  // Path Editor State
  const [showPathEditor, setShowPathEditor] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const {
    frames,
    path,
    currentFrameId,
    selectedFrameId,
    zoom,
    panX,
    panY,
    goToFrame,
    goToNextFrame,
    goToPreviousFrame,
    zoomToFrame,
    fitCanvasToFrames,
    setZoom,
    setPan,
    setOverviewMode,
    overviewMode,
    setCurrentFrame,
    selectFrame,
    updateFrame,
    addFrame,
    setPath,
  } = usePresentationEditorStore();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || canvas) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#f5f5f5",
      selection: mode === 'edit',
      preserveObjectStacking: true,
      stateful: true,
    });

    // Enable pan with mouse drag and handle frame addition
    fabricCanvas.on("mouse:down", (opt) => {
      const evt = opt.e as MouseEvent;
      const target = opt.target;
      
      // Pan with Alt key or middle mouse button
      if (evt.altKey || (evt as any).button === 1) {
        setIsDragging(true);
        setLastPanPoint({ x: evt.clientX, y: evt.clientY });
        fabricCanvas.selection = false;
        fabricCanvas.defaultCursor = 'grabbing';
      }
    });
    
    // Double-click on empty canvas to add new frame
    fabricCanvas.on("mouse:dblclick", (opt) => {
      if (mode === 'edit' && !opt.target && onAddFrame) {
        const pointer = fabricCanvas.getPointer(opt.e);
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          // Convert screen coordinates to world coordinates
          const worldX = (pointer.x - vpt[4]) / vpt[0];
          const worldY = (pointer.y - vpt[5]) / vpt[3];
          onAddFrame({ x: worldX, y: worldY });
        }
      }
    });

    fabricCanvas.on("mouse:move", (opt) => {
      if (isDragging) {
        const evt = opt.e as MouseEvent;
        const deltaX = evt.clientX - lastPanPoint.x;
        const deltaY = evt.clientY - lastPanPoint.y;
        
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          fabricCanvas.setViewportTransform(vpt);
          setPan(vpt[4], vpt[5]);
        }
        
        setLastPanPoint({ x: evt.clientX, y: evt.clientY });
      }
    });

    fabricCanvas.on("mouse:up", () => {
      setIsDragging(false);
      fabricCanvas.selection = mode === 'edit';
      fabricCanvas.defaultCursor = 'default';
    });

    // Zoom with mouse wheel
    fabricCanvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let zoomLevel = fabricCanvas.getZoom();
      zoomLevel *= 0.999 ** delta;
      zoomLevel = Math.max(0.1, Math.min(zoomLevel, 5)); // Limit zoom

      const evt = opt.e as WheelEvent;
      const point = new Point(evt.offsetX, evt.offsetY);
      fabricCanvas.zoomToPoint(point, zoomLevel);
      setZoom(zoomLevel);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    setCanvas(fabricCanvas);

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [width, height, mode]);

  // Render frames on canvas
  useEffect(() => {
    if (!canvas || !frames || frames.length === 0) return;

    // Clear existing frame objects
    const existingObjects = canvas.getObjects();
    existingObjects.forEach((obj) => {
      if ((obj as any).isFrame) {
        canvas.remove(obj);
      }
    });

    // Render each frame as a rectangle with content preview
    frames.forEach((frame, index) => {
      const isCurrent = frame.id === currentFrameId;
      const isSelected = frame.id === selectedFrameId;
      const isInPath = path.includes(frame.id);
      const pathIndex = path.indexOf(frame.id);

      // Frame rectangle
      const frameRect = new Rect({
        left: frame.position.x,
        top: frame.position.y,
        width: frame.width,
        height: frame.height,
        fill: frame.backgroundColor || "#ffffff",
        stroke: isCurrent ? "#3b82f6" : isSelected ? "#10b981" : "#e5e7eb",
        strokeWidth: isCurrent ? 4 : isSelected ? 3 : 2,
        rx: 8,
        ry: 8,
        selectable: mode === 'edit',
        evented: true,
        hoverCursor: 'pointer',
        moveCursor: 'move',
      });

      (frameRect as any).isFrame = true;
      (frameRect as any).frameId = frame.id;
      (frameRect as any).frameIndex = index;

      // Frame title - editable in edit mode
      const titleText = new IText(frame.title || `Slide ${index + 1}`, {
        left: frame.position.x + 20,
        top: frame.position.y + 20,
        fontSize: 18,
        fontFamily: "Arial",
        fill: isCurrent ? "#3b82f6" : "#374151",
        fontWeight: isCurrent ? "bold" : "normal",
        selectable: mode === 'edit',
        evented: mode === 'edit',
        editable: mode === 'edit',
        hasControls: false,
        hasBorders: false,
      });
      
      // Update frame title when edited
      if (mode === 'edit') {
        titleText.on("editing:exited", () => {
          const newTitle = titleText.text || frame.title || `Slide ${index + 1}`;
          updateFrame(frame.id, { title: newTitle });
        });
      }

      (titleText as any).isFrame = true;
      (titleText as any).frameId = frame.id;

      // Path number badge
      if (isInPath && pathIndex !== -1) {
        const pathBadge = new Circle({
          left: frame.position.x + frame.width - 30,
          top: frame.position.y + 20,
          radius: 15,
          fill: "#3b82f6",
          stroke: "#ffffff",
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });

        const pathNumber = new IText(String(pathIndex + 1), {
          left: frame.position.x + frame.width - 30,
          top: frame.position.y + 20,
          fontSize: 12,
          fontFamily: "Arial",
          fill: "#ffffff",
          fontWeight: "bold",
          textAlign: "center",
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });

        (pathBadge as any).isFrame = true;
        (pathNumber as any).isFrame = true;

        canvas.add(pathBadge);
        canvas.add(pathNumber);
      }

      // Click handler - select frame
      frameRect.on("mousedown", () => {
        if (mode === 'edit' && onFrameSelect) {
          onFrameSelect(frame.id);
          selectFrame(frame.id);
          setCurrentFrame(frame.id);
          animatedZoomToFrame(frame.id);
        } else if (mode === 'present') {
          goToFrame(frame.id);
          animatedZoomToFrame(frame.id);
        }
      });
      
      // Double-click handler - edit frame content
      frameRect.on("mousedblclick", () => {
        if (mode === 'edit' && onFrameEdit) {
          onFrameEdit(frame.id);
          selectFrame(frame.id);
          setCurrentFrame(frame.id);
          animatedZoomToFrame(frame.id);
        }
      });
      
      // Drag handler - move frame position
      if (mode === 'edit') {
        frameRect.on("moving", () => {
          // Update frame position in real-time
          const newX = frameRect.left || frame.position.x;
          const newY = frameRect.top || frame.position.y;
          
          if (onFrameMove) {
            onFrameMove(frame.id, { x: newX, y: newY });
          }
        });
        
        frameRect.on("modified", () => {
          // Final position update
          const newX = frameRect.left || frame.position.x;
          const newY = frameRect.top || frame.position.y;
          
          updateFrame(frame.id, {
            position: { x: newX, y: newY }
          });
        });
      }

      canvas.add(frameRect);
      canvas.add(titleText);

      // Render frame elements as mini previews
      if (frame.elements && frame.elements.length > 0) {
        frame.elements.forEach((element) => {
          let previewObj: FabricObject | null = null;
          // Render elements relative to frame position
          const absX = frame.position.x + element.position.x;
          const absY = frame.position.y + element.position.y;

          switch (element.type) {
            case "text":
              let textContent = element.content || "";
              if (typeof textContent === 'string' && textContent.includes('<')) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = textContent;
                textContent = tempDiv.textContent || tempDiv.innerText || "";
              }
              previewObj = new IText(textContent, {
                left: absX,
                top: absY,
                fontSize: element.style?.fontSize || 24,
                fontFamily: element.style?.fontFamily || "Arial",
                fill: element.style?.fill || "#000000",
                width: element.size.width,
                height: element.size.height,
                selectable: false,
                evented: false,
              });
              break;
            case "shape":
              const shapeType = element.content || "rect";
              if (shapeType === "circle") {
                previewObj = new Circle({
                  left: absX,
                  top: absY,
                  radius: element.size.width / 2,
                  fill: element.style?.fill || "#3b82f6",
                  stroke: element.style?.stroke || "#000000",
                  strokeWidth: element.style?.strokeWidth || 0,
                  opacity: element.style?.opacity ?? 1,
                  selectable: false,
                  evented: false,
                });
              } else {
                previewObj = new Rect({
                  left: absX,
                  top: absY,
                  width: element.size.width,
                  height: element.size.height,
                  fill: element.style?.fill || "#3b82f6",
                  stroke: element.style?.stroke || "#000000",
                  strokeWidth: element.style?.strokeWidth || 0,
                  opacity: element.style?.opacity ?? 1,
                  selectable: false,
                  evented: false,
                });
              }
              break;
          }

          if (previewObj) {
            (previewObj as any).isFrame = true;
            (previewObj as any).frameId = frame.id;
            // Add rotation if needed
            if (element.rotation) {
                previewObj.rotate(element.rotation);
            }
            canvas.add(previewObj);
          }
        });
      }
    });

    // Draw path connections
    if (showPath && path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        const currentFrame = frames.find(f => f.id === path[i]);
        const nextFrame = frames.find(f => f.id === path[i + 1]);
        
        if (currentFrame && nextFrame) {
          const startX = currentFrame.position.x + currentFrame.width / 2;
          const startY = currentFrame.position.y + currentFrame.height / 2;
          const endX = nextFrame.position.x + nextFrame.width / 2;
          const endY = nextFrame.position.y + nextFrame.height / 2;

          // Curved path line
          const pathLine = new Line(
            [startX, startY, endX, endY],
            {
              stroke: "#3b82f6",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }
          );

          // Arrow head
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowSize = 10;
          const arrowX = endX - Math.cos(angle) * 20;
          const arrowY = endY - Math.sin(angle) * 20;

          const arrow = new Polygon([
            { x: arrowX, y: arrowY },
            { x: arrowX - arrowSize * Math.cos(angle - Math.PI / 6), y: arrowY - arrowSize * Math.sin(angle - Math.PI / 6) },
            { x: arrowX - arrowSize * Math.cos(angle + Math.PI / 6), y: arrowY - arrowSize * Math.sin(angle + Math.PI / 6) },
          ], {
            fill: "#3b82f6",
            stroke: "#3b82f6",
            selectable: false,
            evented: false,
          });

          (pathLine as any).isPath = true;
          (arrow as any).isPath = true;

          canvas.add(pathLine);
          canvas.add(arrow);
        }
      }
    }

    canvas.renderAll();
  }, [canvas, frames, path, currentFrameId, selectedFrameId, showPath, mode, onFrameSelect, onFrameMove, onFrameEdit, updateFrame]);

  // Sync canvas zoom and pan with store
  useEffect(() => {
    if (!canvas) return;
    // If animating, skip direct update
    if (animationRef.current) return;
    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[0] = zoom;
      vpt[3] = zoom;
      vpt[4] = panX;
      vpt[5] = panY;
      canvas.setViewportTransform(vpt);
      canvas.renderAll();
    }
  }, [canvas, zoom, panX, panY]);

  // Animated transition function
  const animateZoomPan = useCallback((targetZoom: number, targetPanX: number, targetPanY: number, duration = 600) => {
    if (!canvas) return;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    const startZoom = animationState.current.zoom;
    const startPanX = animationState.current.panX;
    const startPanY = animationState.current.panY;
    const startTime = performance.now();

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeInOut(t);
      const newZoom = startZoom + (targetZoom - startZoom) * eased;
      const newPanX = startPanX + (targetPanX - startPanX) * eased;
      const newPanY = startPanY + (targetPanY - startPanY) * eased;
      animationState.current = { zoom: newZoom, panX: newPanX, panY: newPanY };
      if (canvas.viewportTransform) {
        const vpt = canvas.viewportTransform;
        vpt[0] = newZoom;
        vpt[3] = newZoom;
        vpt[4] = newPanX;
        vpt[5] = newPanY;
        canvas.setViewportTransform(vpt);
        canvas.renderAll();
      }
      if (t < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
        setZoom(targetZoom);
        setPan(targetPanX, targetPanY);
      }
    }
    animationRef.current = requestAnimationFrame(step);
  }, [canvas, setZoom, setPan]);

  // Auto-fit to frames when entering overview
  useEffect(() => {
    if (overviewMode && canvas) {
      setTimeout(() => {
        fitCanvasToFrames();
      }, 100);
    }
  }, [overviewMode, canvas, fitCanvasToFrames]);

  // Animated zoom to frame
  const animatedZoomToFrame = (frameId: string) => {
    const frame = frames.find(f => f.id === frameId);
    if (!frame || !canvas) return;
    // Calculate target zoom and pan to fit frame
    const margin = 40;
    const targetZoom = Math.min(
      (width - margin * 2) / frame.width,
      (height - margin * 2) / frame.height,
      2.5
    );
    const targetPanX = width / 2 - (frame.position.x + frame.width / 2) * targetZoom;
    const targetPanY = height / 2 - (frame.position.y + frame.height / 2) * targetZoom;
    animateZoomPan(targetZoom, targetPanX, targetPanY);
  };

  const handleZoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(zoom * 1.2, 5);
    const center = new Point(width / 2, height / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(zoom / 1.2, 0.1);
    const center = new Point(width / 2, height / 2);
    canvas.zoomToPoint(center, newZoom);
    setZoom(newZoom);
  };

  const handleFitToScreen = () => {
    fitCanvasToFrames();
  };

  const handleHome = () => {
    if (currentFrameId) {
      animatedZoomToFrame(currentFrameId);
    } else if (frames.length > 0) {
      animatedZoomToFrame(frames[0].id);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-100 dark:bg-gray-950">
      {/* Path Editor Sidebar/Modal */}
      {showPathEditor && (
        <div className="absolute top-0 left-0 w-80 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-20 shadow-xl flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="font-semibold text-lg">Path Editor</span>
            <Button size="sm" variant="ghost" onClick={() => setShowPathEditor(false)}>Close</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {path.map((frameId, idx) => {
                const frame = frames.find(f => f.id === frameId);
                if (!frame) return null;
                return (
                  <li key={frameId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 cursor-move"
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null && draggedIndex !== idx) {
                        const newPath = [...path];
                        const [removed] = newPath.splice(draggedIndex, 1);
                        newPath.splice(idx, 0, removed);
                        setPath(newPath);
                        setDraggedIndex(null);
                      }
                    }}
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full font-bold text-blue-700 dark:text-blue-300">{idx + 1}</span>
                    <span className="flex-1 truncate">{frame.title || `Slide ${idx + 1}`}</span>
                    <Button size="sm" variant="ghost" onClick={() => {
                      // Remove frame from path
                      setPath(path.filter(id => id !== frameId));
                    }}>Remove</Button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4">
              <Button size="sm" onClick={() => {
                // Add all frames to path
                setPath(frames.map(f => f.id));
              }}>Add All Slides</Button>
            </div>
          </div>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className="cursor-grab active:cursor-grabbing"
        style={{ display: 'block' }}
      />
      
      {/* Add Frame Button - Only in edit mode */}
      {mode === 'edit' && (
        <div className="absolute top-4 left-4 z-10">
          <Button
            onClick={() => {
              // Add frame at center of current view
              if (canvas && onAddFrame) {
                const centerX = width / 2;
                const centerY = height / 2;
                const vpt = canvas.viewportTransform;
                if (vpt) {
                  const worldX = (centerX - vpt[4]) / vpt[0];
                  const worldY = (centerY - vpt[5]) / vpt[3];
                  onAddFrame({ x: worldX, y: worldY });
                }
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            title="Add New Slide (or double-click empty canvas)"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Slide
          </Button>
        </div>
      )}
      
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        {/* Path Editor Toggle */}
        <div className="mb-2">
          <Button size="sm" variant="outline" onClick={() => setShowPathEditor(v => !v)} title="Edit Slide Path">
            <Route className="w-4 h-4 mr-2" /> Path Editor
          </Button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-2 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            title="Zoom In (Ctrl +)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            title="Zoom Out (Ctrl -)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitToScreen}
            title="Fit All Slides"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHome}
            title="Go to Current Slide"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>

        {mode === 'edit' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOverviewMode(!overviewMode);
                if (!overviewMode) {
                  fitCanvasToFrames();
                }
              }}
              className={overviewMode ? "bg-blue-50 dark:bg-blue-950" : ""}
              title="Toggle Overview Mode"
            >
              {overviewMode ? <EyeOff className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPath(!showPath)}
              className={showPath ? "bg-blue-50 dark:bg-blue-950" : ""}
              title="Toggle Path Visualization"
            >
              {showPath ? <Route className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {mode === 'present' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-2 flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousFrame}
              title="Previous Slide (←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextFrame}
              title="Next Slide (→)"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Minimap/Overview Panel */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-3 z-20" style={{ width: 180, height: 140 }}>
        <div className="relative w-full h-full">
          {/* Minimap Canvas */}
          <svg width={160} height={110} style={{ position: 'absolute', top: 0, left: 0 }}>
            {frames.map((frame, idx) => {
              // Scale frames to minimap size
              const minX = Math.min(...frames.map(f => f.position.x));
              const minY = Math.min(...frames.map(f => f.position.y));
              const maxX = Math.max(...frames.map(f => f.position.x + f.width));
              const maxY = Math.max(...frames.map(f => f.position.y + f.height));
              const scaleX = 140 / Math.max(1, maxX - minX);
              const scaleY = 90 / Math.max(1, maxY - minY);
              const x = (frame.position.x - minX) * scaleX + 10;
              const y = (frame.position.y - minY) * scaleY + 10;
              const w = frame.width * scaleX;
              const h = frame.height * scaleY;
              const isCurrent = frame.id === currentFrameId;
              return (
                <rect
                  key={frame.id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={4}
                  fill={isCurrent ? '#3b82f6' : '#e5e7eb'}
                  stroke={isCurrent ? '#1e40af' : '#6b7280'}
                  strokeWidth={isCurrent ? 3 : 1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => animatedZoomToFrame(frame.id)}
                />
              );
            })}
          </svg>
          <div className="absolute bottom-1 left-1 text-[10px] text-gray-500">Minimap</div>
        </div>
      </div>
      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-3 z-10">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>Slides: {frames.length}</div>
          {currentFrameId && (
            <div>Current: {frames.findIndex(f => f.id === currentFrameId) + 1} / {frames.length}</div>
          )}
          <div className="text-[10px] text-gray-500 mt-2">
            {mode === 'edit' && "Alt + Drag to pan • Scroll to zoom • Click frame to edit"}
            {mode === 'present' && "Arrow keys to navigate • Click frame to jump"}
          </div>
        </div>
      </div>
    </div>
  );
}

