"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, Rect, IText, Circle, Image, Triangle, Ellipse, Line, Polygon, type Object as FabricObject, Group } from "fabric";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, MoreVertical, Music, Zap, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface StoryboardViewProps {
  onSlideSelect: (index: number) => void;
  selectedSlideIndex: number;
}

export function StoryboardView({ onSlideSelect, selectedSlideIndex }: StoryboardViewProps) {
  const { frames, path, deleteFrame, duplicateFrame, updateFrame, reorderFrame } = usePresentationEditorStore();
  const { toast } = useToast();
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const canvasInstances = useRef<Map<string, Canvas>>(new Map());
  const contentHashes = useRef<Map<string, string>>(new Map());
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const [activeTab, setActiveTab] = useState("slides");

  const currentFrame = frames[selectedSlideIndex];

  // Extract slide header/content summary
  const getSlideHeader = (slide: any): string => {
    if (slide.title && slide.title !== `Slide ${frames.indexOf(slide) + 1}`) {
      return slide.title;
    }
    
    // Try to find first text element
    if (slide.elements && slide.elements.length > 0) {
      const firstTextElement = slide.elements.find((el: any) => el.type === 'text');
      if (firstTextElement && firstTextElement.content) {
        let text = firstTextElement.content;
        // Strip HTML tags if present
        if (typeof text === 'string' && text.includes('<')) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          text = tempDiv.textContent || tempDiv.innerText || '';
        }
        // Return first line or first 50 chars
        const firstLine = text.split('\n')[0].trim();
        return firstLine.substring(0, 50) || 'Empty slide';
      }
    }
    
    return slide.title || `Slide ${frames.indexOf(slide) + 1}`;
  };

  // Update preview URL - defined first
  const updatePreviewUrl = useCallback((frameId: string, canvas: Canvas) => {
    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1,
      });
      setPreviewUrls(prev => {
        const newMap = new Map(prev);
        newMap.set(frameId, dataURL);
        return newMap;
      });
    } catch (error) {
      console.error("Error creating preview URL:", error);
    }
  }, []);

  // Generate preview for a slide
  const generatePreview = useCallback((frameId: string, frame: any) => {
    // Use a timeout to ensure canvas element is in DOM
    setTimeout(() => {
      const canvasElement = canvasRefs.current.get(frameId);
      if (!canvasElement) return;

      try {
        // Dispose existing canvas if any
        const existingCanvas = canvasInstances.current.get(frameId);
        if (existingCanvas) {
          existingCanvas.dispose();
          canvasInstances.current.delete(frameId);
        }

        const canvas = new Canvas(canvasElement, {
          width: 320,
          height: 180,
          backgroundColor: frame.backgroundColor || "#ffffff",
          renderOnAddRemove: true,
        });

        // Store canvas reference
        canvasInstances.current.set(frameId, canvas);
        
        const scaleX = 320 / (frame.width || 960);
        const scaleY = 180 / (frame.height || 540);
        const scale = Math.min(scaleX, scaleY);
        
        // Track async image loads
        let pendingImages = 0;
        let loadedImages = 0;
        
        const checkAndRender = () => {
          if (pendingImages === 0 || loadedImages === pendingImages) {
            canvas.renderAll();
            updatePreviewUrl(frameId, canvas);
          }
        };

        // Render elements
        if (frame.elements && frame.elements.length > 0) {
          frame.elements.forEach((element: any, elementIndex: number) => {
            let fabricObj: FabricObject | null = null;

          switch (element.type) {
            case "text":
              let textContent = element.content || "";
              if (typeof textContent === 'string' && textContent.includes('<')) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = textContent;
                textContent = tempDiv.textContent || tempDiv.innerText || "";
              }
              if (!textContent || textContent.trim() === '') {
                textContent = "Text";
              }
              // Show more text content in preview, especially for headers
              const displayText = textContent.length > 100 
                ? textContent.substring(0, 100) + '...' 
                : textContent;
              
              // Use larger font for headers (first text element or title-like content)
              const isHeader = elementIndex === 0 || (element.style?.fontSize || 24) >= 32;
              const fontSize = isHeader 
                ? Math.max(12, (element.style?.fontSize || 24) * scale * 0.8)
                : Math.max(8, (element.style?.fontSize || 24) * scale * 0.6);
              
              fabricObj = new IText(displayText, {
                left: (element.position.x || 0) * scale,
                top: (element.position.y || 0) * scale,
                fontSize: fontSize,
                fontFamily: element.style?.fontFamily || "Arial",
                fill: element.style?.fill || "#000000",
                width: (element.size.width || 200) * scale,
                selectable: false,
                evented: false,
                textAlign: element.style?.textAlign || 'left',
                fontWeight: element.style?.fontWeight || 'normal',
              });
              break;

            case "shape":
              const shapeType = element.content || "rect";
              if (shapeType === "circle") {
                fabricObj = new Circle({
                  left: (element.position.x || 0) * scale,
                  top: (element.position.y || 0) * scale,
                  radius: ((element.size.width || 100) / 2) * scale,
                  fill: element.style?.fill || "#3b82f6",
                  stroke: element.style?.stroke || "#000000",
                  strokeWidth: (element.style?.strokeWidth || 0) * scale,
                  selectable: false,
                  evented: false,
                });
              } else if (shapeType === "triangle") {
                fabricObj = new Triangle({
                  left: (element.position.x || 0) * scale,
                  top: (element.position.y || 0) * scale,
                  width: (element.size.width || 100) * scale,
                  height: (element.size.height || 100) * scale,
                  fill: element.style?.fill || "#3b82f6",
                  stroke: element.style?.stroke || "#000000",
                  strokeWidth: (element.style?.strokeWidth || 0) * scale,
                  selectable: false,
                  evented: false,
                });
              } else if (shapeType === "ellipse") {
                fabricObj = new Ellipse({
                  left: (element.position.x || 0) * scale,
                  top: (element.position.y || 0) * scale,
                  rx: ((element.size.width || 100) / 2) * scale,
                  ry: ((element.size.height || 60) / 2) * scale,
                  fill: element.style?.fill || "#3b82f6",
                  stroke: element.style?.stroke || "#000000",
                  strokeWidth: (element.style?.strokeWidth || 0) * scale,
                  selectable: false,
                  evented: false,
                });
              } else if (shapeType === "line") {
                fabricObj = new Line([
                  (element.position.x || 0) * scale,
                  (element.position.y || 0) * scale,
                  ((element.position.x || 0) + (element.size.width || 100)) * scale,
                  ((element.position.y || 0) + (element.size.height || 0)) * scale
                ], {
                  stroke: element.style?.fill || element.style?.stroke || "#3b82f6",
                  strokeWidth: (element.style?.strokeWidth || 3) * scale,
                  selectable: false,
                  evented: false,
                });
              } else if (shapeType === "arrow") {
                const arrowPoints = [
                  { x: (element.position.x || 0) * scale, y: (element.position.y || 0) * scale },
                  { x: ((element.position.x || 0) + (element.size.width || 100) * 0.8) * scale, y: (element.position.y || 0) * scale },
                  { x: ((element.position.x || 0) + (element.size.width || 100) * 0.8) * scale, y: ((element.position.y || 0) - 10) * scale },
                  { x: ((element.position.x || 0) + (element.size.width || 100)) * scale, y: (element.position.y || 0) * scale },
                  { x: ((element.position.x || 0) + (element.size.width || 100) * 0.8) * scale, y: ((element.position.y || 0) + 10) * scale },
                  { x: ((element.position.x || 0) + (element.size.width || 100) * 0.8) * scale, y: (element.position.y || 0) * scale },
                ];
                fabricObj = new Polygon(arrowPoints, {
                  fill: element.style?.fill || "#3b82f6",
                  stroke: element.style?.stroke || "#000000",
                  strokeWidth: (element.style?.strokeWidth || 0) * scale,
                  selectable: false,
                  evented: false,
                });
              } else {
                fabricObj = new Rect({
                  left: (element.position.x || 0) * scale,
                  top: (element.position.y || 0) * scale,
                  width: (element.size.width || 100) * scale,
                  height: (element.size.height || 100) * scale,
                  fill: element.style?.fill || "#3b82f6",
                  stroke: element.style?.stroke || "#000000",
                  strokeWidth: (element.style?.strokeWidth || 0) * scale,
                  selectable: false,
                  evented: false,
                });
              }
              break;

            case "image":
              if (element.content) {
                pendingImages++;
                Image.fromURL(element.content, {
                  crossOrigin: 'anonymous',
                }).then((img) => {
                  const imgWidth = img.width || 200;
                  const imgHeight = img.height || 200;
                  const targetWidth = (element.size.width || imgWidth) * scale;
                  const targetHeight = (element.size.height || imgHeight) * scale;
                  
                  img.set({
                    left: (element.position.x || 0) * scale,
                    top: (element.position.y || 0) * scale,
                    scaleX: targetWidth / imgWidth,
                    scaleY: targetHeight / imgHeight,
                    selectable: false,
                    evented: false,
                    originX: 'left',
                    originY: 'top',
                  });
                  canvas.add(img);
                  loadedImages++;
                  checkAndRender();
                }).catch((error) => {
                  console.warn("Failed to load image for preview:", error);
                  // Add placeholder rectangle for failed images
                  const placeholder = new Rect({
                    left: (element.position.x || 0) * scale,
                    top: (element.position.y || 0) * scale,
                    width: (element.size.width || 200) * scale,
                    height: (element.size.height || 200) * scale,
                    fill: "#e5e7eb",
                    stroke: "#9ca3af",
                    strokeWidth: 1,
                    selectable: false,
                    evented: false,
                  });
                  canvas.add(placeholder);
                  loadedImages++;
                  checkAndRender();
                });
                return;
              }
              break;
          }

            if (fabricObj) {
              canvas.add(fabricObj);
            }
          });
        } else {
          // Empty slide - show placeholder text
          const placeholderText = new IText("Empty Slide", {
            left: 160,
            top: 90,
            fontSize: 14,
            fontFamily: "Arial",
            fill: "#9ca3af",
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          });
          canvas.add(placeholderText);
        }

        // Initial render (will be updated when images load)
        checkAndRender();
      } catch (error) {
        console.error("Error generating preview:", error);
        // Show error placeholder
        const errorText = new IText("Preview Error", {
          left: 160,
          top: 90,
          fontSize: 12,
          fontFamily: "Arial",
          fill: "#ef4444",
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });
        const canvas = canvasInstances.current.get(frameId);
        if (canvas) {
          canvas.add(errorText);
          canvas.renderAll();
          updatePreviewUrl(frameId, canvas);
        }
      }
    }, 100);
  }, [updatePreviewUrl]);

  // Generate previews when frames change
  useEffect(() => {
    // Cleanup old previews and canvases
    const frameIds = new Set(frames.map(f => f.id));
    setPreviewUrls(prev => {
      const newMap = new Map(prev);
      let changed = false;
      prev.forEach((_, frameId) => {
        if (!frameIds.has(frameId)) {
          newMap.delete(frameId);
          changed = true;
          // Dispose canvas
          const existingCanvas = canvasInstances.current.get(frameId);
          if (existingCanvas) {
            existingCanvas.dispose();
            canvasInstances.current.delete(frameId);
          }
          canvasRefs.current.delete(frameId);
        }
      });
      return changed ? newMap : prev;
    });

    // Generate previews for all frames - regenerate to catch content changes
    frames.forEach((frame) => {
      // Create a content hash to detect changes
      const contentHash = JSON.stringify({
        id: frame.id,
        title: frame.title,
        backgroundColor: frame.backgroundColor,
        elementsCount: frame.elements?.length || 0,
        // Include all elements to detect changes in content or style
        elements: frame.elements?.map((el: any) => ({
          id: el.id,
          type: el.type,
          position: el.position,
          size: el.size,
          content: el.content,
          style: el.style,
          rotation: el.rotation
        })) || [],
      });
      
      // Check if content has changed
      const previousHash = contentHashes.current.get(frame.id);
      if (previousHash !== contentHash) {
        // Content changed - regenerate preview
        contentHashes.current.set(frame.id, contentHash);
        // Clear existing preview
        setPreviewUrls(prev => {
          const newMap = new Map(prev);
          newMap.delete(frame.id);
          return newMap;
        });
        // Generate new preview
        generatePreview(frame.id, frame);
      } else if (!previewUrls.get(frame.id)) {
        // No preview exists yet - generate it
        generatePreview(frame.id, frame);
      }
    });

    // Cleanup on unmount
    return () => {
      canvasInstances.current.forEach((canvas) => {
        canvas.dispose();
      });
      canvasInstances.current.clear();
      canvasRefs.current.clear();
    };
  }, [frames, generatePreview]);

  const handleDelete = (frameId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (frames.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one slide",
        variant: "destructive",
      });
      return;
    }
    deleteFrame(frameId);
    toast({
      title: "Deleted",
      description: "Slide deleted successfully",
    });
    // Select previous slide if current was deleted
    if (selectedSlideIndex === index && index > 0) {
      onSlideSelect(index - 1);
    } else if (selectedSlideIndex === index) {
      onSlideSelect(0);
    }
  };

  const handleDuplicate = (frameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateFrame(frameId);
    toast({
      title: "Duplicated",
      description: "Slide duplicated successfully",
    });
  };

  if (frames.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <p className="text-2xl">📊</p>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          No slides yet
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Click "Add slide" above to get started
        </p>
      </div>
    );
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentFrame) {
      updateFrame(currentFrame.id, { notes: e.target.value });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slides">Slides</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="slides" className="flex-1 overflow-y-auto p-4 mt-0 pb-20">
          <div className="grid grid-cols-2 gap-4">
            {frames.map((slide, index) => {
        const isSelected = selectedSlideIndex === index;
        const isInPath = path.includes(slide.id);
        const previewUrl = previewUrls.get(slide.id);

        return (
          <div
            key={slide.id}
            onClick={() => onSlideSelect(index)}
            className={`relative group cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden ${
              isSelected
                ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20 scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
            }`}
          >
            {/* Slide Number Badge */}
            <div className={`absolute top-2 left-2 bg-white dark:bg-gray-800 rounded-md px-2 py-1 text-xs font-semibold z-10 shadow-sm transition-colors ${
              isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {index + 1}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (index > 0) reorderFrame(index, index - 1);
                }}
                disabled={index === 0}
                className="h-6 w-6 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
                title="Move Up"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (index < frames.length - 1) reorderFrame(index, index + 1);
                }}
                disabled={index === frames.length - 1}
                className="h-6 w-6 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
                title="Move Down"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDuplicate(slide.id, e)}
                className="h-6 w-6 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800"
                title="Duplicate slide"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDelete(slide.id, index, e)}
                className="h-6 w-6 p-0 bg-white/90 dark:bg-gray-800/90 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                title="Delete slide"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Preview Canvas */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden rounded-t-lg">
              {previewUrl ? (
                <img
                  key={`preview-${slide.id}`}
                  src={previewUrl}
                  alt={`Slide ${index + 1} preview`}
                  className="w-full h-full object-contain"
                  style={{
                    backgroundColor: slide.backgroundColor || '#ffffff',
                  }}
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  onLoad={() => {
                    // Preview loaded successfully
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center relative"
                  style={{
                    backgroundColor: slide.backgroundColor || '#ffffff',
                  }}
                >
                  {/* Loading indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500"></div>
                  </div>
                  {/* Fallback content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                    {slide.elements && slide.elements.length > 0 ? (
                      <>
                        <p className={`text-xs font-semibold text-center px-4 mb-1 ${
                          isSelected 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {getSlideHeader(slide)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {slide.elements.length} elements
                        </p>
                      </>
                    ) : (
                      <p className={`text-xs font-semibold text-center px-4 ${
                        isSelected 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {slide.title || `Slide ${index + 1}`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Hidden canvas for rendering - outside the preview div to avoid DOM conflicts */}
            <canvas
              key={`canvas-${slide.id}`}
              ref={(el) => {
                if (el) {
                  const existing = canvasRefs.current.get(slide.id);
                  if (existing !== el) {
                    canvasRefs.current.set(slide.id, el);
                    // Generate preview after canvas is mounted
                    setTimeout(() => generatePreview(slide.id, slide), 50);
                  }
                } else {
                  // Cleanup when ref is null
                  const canvas = canvasInstances.current.get(slide.id);
                  if (canvas) {
                    canvas.dispose();
                    canvasInstances.current.delete(slide.id);
                  }
                  canvasRefs.current.delete(slide.id);
                }
              }}
              className="absolute opacity-0 pointer-events-none"
              style={{ 
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                width: '320px',
                height: '180px'
              }}
              width={320}
              height={180}
            />

            {/* Path Indicator */}
            {isInPath && (
              <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-green-500 dark:bg-green-400 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-900"></div>
            )}

            {/* Selection Ring */}
            {isSelected && (
              <div className="absolute inset-0 rounded-lg ring-2 ring-blue-500 dark:ring-blue-400 ring-inset pointer-events-none"></div>
            )}

            {/* Slide Header/Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 rounded-b-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate mb-0.5" title={getSlideHeader(slide)}>
                    {getSlideHeader(slide)}
                  </p>
                  {slide.elements && slide.elements.length > 0 && (
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-white/70">
                        {slide.elements.length} {slide.elements.length === 1 ? 'element' : 'elements'}
                      </p>
                      {slide.elements.some((el: any) => el.type === 'image') && (
                        <span className="text-[10px] text-white/60">📷</span>
                      )}
                      {slide.elements.some((el: any) => el.type === 'shape') && (
                        <span className="text-[10px] text-white/60">🔷</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                   <div className="flex gap-1">
                      <Zap className="w-3 h-3 text-yellow-400/80" />
                      <Music className="w-3 h-3 text-blue-400/80" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
            })}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 p-4 mt-0">
          {currentFrame ? (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Speaker Notes</h3>
                <span className="text-xs text-muted-foreground">
                  Slide {selectedSlideIndex + 1} of {frames.length}
                </span>
              </div>
              <Textarea
                value={currentFrame.notes || ""}
                onChange={handleNotesChange}
                placeholder="Add speaker notes here..."
                className="flex-1 resize-none h-[calc(100%-2rem)]"
              />
              <div className="text-xs text-muted-foreground">
                These notes will be visible in presenter view.
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select a slide to add notes
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

