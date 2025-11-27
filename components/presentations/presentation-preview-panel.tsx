"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, IText, Circle, Image, Triangle, Ellipse, Line, Polygon, type Object as FabricObject } from "fabric";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";

interface PresentationPreviewPanelProps {
  frameId: string;
  width: number;
  height: number;
  onClose?: () => void;
  mode?: 'panel' | 'fullscreen';
}

export function PresentationPreviewPanel({ 
  frameId, 
  width, 
  height, 
  onClose,
  mode = 'panel' 
}: PresentationPreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const { frames, currentFrameId, goToNextFrame, goToPreviousFrame } = usePresentationEditorStore();
  
  const frame = frames.find((f) => f.id === frameId);
  const isFullscreen = mode === 'fullscreen';

  // Initialize canvas for preview
  useEffect(() => {
    if (!canvasRef.current || canvas) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: frame?.backgroundColor || "#ffffff",
      selection: false, // No selection in preview
      interactive: false, // Read-only preview
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [width, height]);

  // Render frame content
  useEffect(() => {
    if (!canvas || !frame) return;

    canvas.clear();
    canvas.backgroundColor = frame.backgroundColor || "#ffffff";

    if (!frame.elements || frame.elements.length === 0) {
      canvas.renderAll();
      return;
    }

    frame.elements.forEach((element) => {
      let fabricObj: FabricObject | null = null;

      switch (element.type) {
        case "text":
          let textContent = element.content || "";
          if (typeof textContent === 'string' && textContent.includes('<')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = textContent;
            textContent = tempDiv.textContent || tempDiv.innerText || "";
          }
          fabricObj = new IText(textContent, {
            left: element.position.x,
            top: element.position.y,
            fontSize: element.style?.fontSize || 24,
            fontFamily: element.style?.fontFamily || "Arial",
            fill: element.style?.fill || "#000000",
            width: element.size.width || 200,
            selectable: false,
            evented: false,
          });
          break;

        case "shape":
          const shapeType = element.content || "rect";
          if (shapeType === "circle") {
            fabricObj = new Circle({
              left: element.position.x,
              top: element.position.y,
              radius: element.size.width / 2,
              fill: element.style?.fill || "#3b82f6",
              stroke: element.style?.stroke || "#000000",
              strokeWidth: element.style?.strokeWidth || 0,
              selectable: false,
              evented: false,
            });
          } else if (shapeType === "triangle") {
            fabricObj = new Triangle({
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              fill: element.style?.fill || "#3b82f6",
              stroke: element.style?.stroke || "#000000",
              strokeWidth: element.style?.strokeWidth || 0,
              opacity: element.style?.opacity ?? 1,
              selectable: false,
              evented: false,
            });
          } else if (shapeType === "ellipse") {
            fabricObj = new Ellipse({
              left: element.position.x,
              top: element.position.y,
              rx: element.size.width / 2,
              ry: element.size.height / 2,
              fill: element.style?.fill || "#3b82f6",
              stroke: element.style?.stroke || "#000000",
              strokeWidth: element.style?.strokeWidth || 0,
              opacity: element.style?.opacity ?? 1,
              selectable: false,
              evented: false,
            });
          } else {
            fabricObj = new Rect({
              left: element.position.x,
              top: element.position.y,
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

        case "image":
          if (element.content) {
            Image.fromURL(element.content).then((img) => {
              img.set({
                left: element.position.x,
                top: element.position.y,
                scaleX: element.size.width / (img.width || 1),
                scaleY: element.size.height / (img.height || 1),
                selectable: false,
                evented: false,
              });
              canvas.add(img);
              canvas.renderAll();
            });
            return;
          }
          break;
      }

      if (fabricObj) {
        canvas.add(fabricObj);
      }
    });

    canvas.renderAll();
  }, [canvas, frame, frameId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
          goToPreviousFrame();
        } else {
          goToNextFrame();
        }
      }
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToNextFrame, goToPreviousFrame, onClose]);

  return (
    <div className={`relative bg-black ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-lg border border-gray-200 dark:border-gray-800'}`}>
      {/* Preview Canvas */}
      <div className="flex items-center justify-center" style={{ width: `${width}px`, height: `${height}px` }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      {/* Navigation Controls */}
      {isFullscreen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousFrame}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-white text-sm px-4">
            {frames.findIndex(f => f.id === frameId) + 1} / {frames.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextFrame}
            className="text-white hover:bg-white/20"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={`absolute top-4 right-4 text-white hover:bg-white/20 ${isFullscreen ? '' : 'bg-black/50'}`}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

