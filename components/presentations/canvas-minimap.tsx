"use client";

import { useEffect, useRef, useState } from "react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2 } from "lucide-react";

export function CanvasMinimap() {
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    frames,
    path,
    canvas,
    zoom,
    panX,
    panY,
    selectedFrameId,
    goToFrame,
  } = usePresentationEditorStore();

  useEffect(() => {
    if (!minimapRef.current || !canvas) return;

    const minimapCanvas = minimapRef.current;
    const ctx = minimapCanvas.getContext("2d");
    if (!ctx) return;

    const width = isExpanded ? 400 : 240;
    const height = isExpanded ? 300 : 180;
    minimapCanvas.width = width;
    minimapCanvas.height = height;

    // Calculate canvas bounds
    if (frames.length === 0) return;

    const allX = frames.map((f) => [f.position.x, f.position.x + f.width]).flat();
    const allY = frames.map((f) => [f.position.y, f.position.y + f.height]).flat();
    const minX = Math.min(...allX) - 100;
    const maxX = Math.max(...allX) + 100;
    const minY = Math.min(...allY) - 100;
    const maxY = Math.max(...allY) + 100;

    const canvasWidth = maxX - minX;
    const canvasHeight = maxY - minY;
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    // Clear with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1a1a1a");
    gradient.addColorStop(1, "#0f0f0f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
    ctx.lineWidth = 0.5;
    const gridSize = 25;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw path connections with arrow
    if (path.length > 1) {
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      for (let i = 0; i < path.length - 1; i++) {
        const frame1 = frames.find((f) => f.id === path[i]);
        const frame2 = frames.find((f) => f.id === path[i + 1]);
        if (frame1 && frame2) {
          const x1 = (frame1.position.x + frame1.width / 2 - minX) * scale;
          const y1 = (frame1.position.y + frame1.height / 2 - minY) * scale;
          const x2 = (frame2.position.x + frame2.width / 2 - minX) * scale;
          const y2 = (frame2.position.y + frame2.height / 2 - minY) * scale;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          
          // Draw arrow head
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const arrowLength = 8;
          const arrowAngle = Math.PI / 6;
          
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - arrowLength * Math.cos(angle - arrowAngle),
            y2 - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - arrowLength * Math.cos(angle + arrowAngle),
            y2 - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    // Draw frames
    frames.forEach((frame) => {
      const x = (frame.position.x - minX) * scale;
      const y = (frame.position.y - minY) * scale;
      const w = frame.width * scale;
      const h = frame.height * scale;

      // Frame background
      ctx.fillStyle = frame.backgroundColor || "#ffffff";
      ctx.fillRect(x, y, w, h);

      // Frame border with better styling
      if (frame.id === selectedFrameId) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
        ctx.shadowBlur = 4;
      } else if (path.includes(frame.id)) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(16, 185, 129, 0.3)";
        ctx.shadowBlur = 3;
      } else {
        ctx.strokeStyle = "#4b5563";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      ctx.strokeRect(x, y, w, h);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Frame number
      if (isExpanded) {
        const pathIndex = path.indexOf(frame.id);
        if (pathIndex >= 0) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            `${pathIndex + 1}`,
            x + w / 2,
            y + h / 2 + 3
          );
        }
      }
    });

    // Draw viewport indicator with fill
    const viewportX = (-panX / zoom - minX) * scale;
    const viewportY = (-panY / zoom - minY) * scale;
    const viewportW = (canvas.width / zoom) * scale;
    const viewportH = (canvas.height / zoom) * scale;

    // Fill
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
    
    // Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);
    ctx.setLineDash([]);
  }, [frames, path, selectedFrameId, canvas, zoom, panX, panY, isExpanded]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas || !minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked frame
    const width = isExpanded ? 400 : 240;
    const height = isExpanded ? 300 : 180;

    const allX = frames.map((f) => [f.position.x, f.position.x + f.width]).flat();
    const allY = frames.map((f) => [f.position.y, f.position.y + f.height]).flat();
    const minX = Math.min(...allX) - 100;
    const minY = Math.min(...allY) - 100;

    const canvasWidth = Math.max(...allX) - minX + 200;
    const canvasHeight = Math.max(...allY) - minY + 200;
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    const worldX = x / scale + minX;
    const worldY = y / scale + minY;

    // Find closest frame
    let closestFrame = null;
    let minDist = Infinity;
    frames.forEach((frame) => {
      const centerX = frame.position.x + frame.width / 2;
      const centerY = frame.position.y + frame.height / 2;
      const dist = Math.sqrt(
        Math.pow(centerX - worldX, 2) + Math.pow(centerY - worldY, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestFrame = frame;
      }
    });

    if (closestFrame) {
      goToFrame(closestFrame.id);
    }
  };

  if (frames.length === 0) return null;

  return (
    <div
      className={`absolute bottom-6 right-6 bg-gray-900/95 backdrop-blur-md border border-gray-800/60 rounded-xl shadow-2xl z-20 transition-all duration-200 ${
        isExpanded ? "p-4" : "p-2.5"
      }`}
      style={{
        maxWidth: 'calc(100% - 3rem)',
      }}
    >
      <div className="flex items-center justify-end mb-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <canvas
        ref={minimapRef}
        onClick={handleMinimapClick}
        className="cursor-pointer border border-gray-800/60 rounded-lg bg-gray-950/50 hover:border-gray-700/60 transition-colors"
        style={{
          width: isExpanded ? 400 : 240,
          height: isExpanded ? 300 : 180,
        }}
      />
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-800/60 text-xs text-gray-400 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 bg-white/90 rounded-sm shadow-sm"></div>
            <span className="text-gray-300">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-green-500 bg-white/90 rounded-sm shadow-sm"></div>
            <span className="text-gray-300">In Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-gray-500 bg-white/90 rounded-sm shadow-sm"></div>
            <span className="text-gray-300">Other Frames</span>
          </div>
        </div>
      )}
    </div>
  );
}

