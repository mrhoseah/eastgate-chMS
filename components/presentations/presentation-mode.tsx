"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

interface PresentationModeProps {
  onExit: () => void;
}

export function PresentationMode({ onExit }: PresentationModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportScale, setViewportScale] = useState(1);

  // Fixed 1920x1080 viewport dimensions
  const viewportWidth = 1920;
  const viewportHeight = 1080;

  const {
    frames,
    path,
    currentFrameId,
    goToNextFrame,
    goToPreviousFrame,
    goToFrame,
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
  } = usePresentationEditorStore();

  const currentFrame = currentFrameId
    ? frames.find((f) => f.id === currentFrameId)
    : null;

  // Initialize presentation - go to first frame in path
  useEffect(() => {
    if (path.length > 0 && !currentFrameId) {
      goToFrame(path[0]);
    }
  }, [path, currentFrameId, goToFrame]);

  // Animate to frame with GSAP
  useEffect(() => {
    if (!currentFrame) return;

    const frame = currentFrame;
    // Use fixed 1920x1080 viewport dimensions
    const viewportWidth = 1920;
    const viewportHeight = 1080;

    // Calculate target zoom and pan
    const centerX = frame.position.x + frame.width / 2;
    const centerY = frame.position.y + frame.height / 2;

    const zoomX = (viewportWidth * 0.8) / frame.width;
    const zoomY = (viewportHeight * 0.8) / frame.height;
    const targetZoom = Math.min(zoomX, zoomY, 4);

    const targetPanX = viewportWidth / 2 - centerX * targetZoom;
    const targetPanY = viewportHeight / 2 - centerY * targetZoom;

    // Animate with GSAP - Prezi-like smooth transitions
    gsap.to(
      {},
      {
        duration: 1.8,
        ease: "power3.inOut", // Smoother easing for Prezi-like feel
        onUpdate: function () {
          const progress = this.progress();
          // Use easeOutCubic for more natural motion
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          const currentZoom = gsap.utils.interpolate(zoom, targetZoom, easedProgress);
          const currentPanX = gsap.utils.interpolate(panX, targetPanX, easedProgress);
          const currentPanY = gsap.utils.interpolate(panY, targetPanY, easedProgress);

          setZoom(currentZoom);
          setPan(currentPanX, currentPanY);
        },
        onComplete: () => {
          // Ensure final values are set
          setZoom(targetZoom);
          setPan(targetPanX, targetPanY);
        },
      }
    );
  }, [currentFrameId, currentFrame, zoom, panX, panY, setZoom, setPan]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          if (goToNextFrame) goToNextFrame();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (goToPreviousFrame) goToPreviousFrame();
          break;
        case "Escape":
          e.preventDefault();
          onExit();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToNextFrame, goToPreviousFrame, onExit]);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const element = containerRef.current || document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Calculate viewport scale to fit screen
  useEffect(() => {
    const calculateScale = () => {
      const scale = Math.min(
        1,
        window.innerWidth / viewportWidth,
        window.innerHeight / viewportHeight
      );
      setViewportScale(scale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const currentIndex = currentFrameId ? path.indexOf(currentFrameId) : -1;
  
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950 z-[9999] overflow-hidden flex items-center justify-center"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* Viewport container - 1920x1080 */}
      <div
        ref={viewportRef}
        className="relative bg-black"
        style={{
          width: `${viewportWidth}px`,
          height: `${viewportHeight}px`,
          aspectRatio: `${viewportWidth} / ${viewportHeight}`,
          transform: `scale(${viewportScale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
        {/* Render all frames */}
        {frames.map((frame) => {
          const isCurrent = frame.id === currentFrameId;
          return (
            <div
              key={frame.id}
              className={`absolute transition-opacity duration-500 ${
                isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              style={{
                left: `${frame.position.x}px`,
                top: `${frame.position.y}px`,
                width: `${frame.width}px`,
                height: `${frame.height}px`,
                transform: `rotate(${frame.rotation}deg)`,
                transformOrigin: "center center",
                backgroundColor: frame.backgroundColor || "#ffffff",
                border: `2px solid ${frame.borderColor || "#e5e7eb"}`,
                borderRadius: "8px",
                padding: "20px",
              }}
            >
              {/* Render frame elements */}
              {frame.elements.map((element) => {
                const elementStyle: React.CSSProperties = {
                  position: "absolute",
                  left: `${element.position.x}px`,
                  top: `${element.position.y}px`,
                  width: `${element.size.width}px`,
                  height: `${element.size.height}px`,
                  transform: `rotate(${element.rotation}deg)`,
                  transformOrigin: "center center",
                };

                switch (element.type) {
                  case "text":
                    return (
                      <div
                        key={element.id}
                        style={{
                          ...elementStyle,
                          fontSize: `${element.style.fontSize || 24}px`,
                          fontFamily: element.style.fontFamily || "Arial",
                          color: element.style.fill || "#000000",
                        }}
                        dangerouslySetInnerHTML={{ __html: element.content || "" }}
                      />
                    );

                  case "image":
                    return (
                      <img
                        key={element.id}
                        src={element.content || ""}
                        alt=""
                        style={elementStyle}
                      />
                    );

                  case "shape":
                    const shapeType = element.content || "rect";
                    const strokeWidth = element.style.strokeWidth !== undefined ? element.style.strokeWidth : 0;
                    const borderStyle = strokeWidth > 0 ? `${strokeWidth}px solid ${element.style.stroke || "#000000"}` : "none";
                    
                    if (shapeType === "circle") {
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...elementStyle,
                            borderRadius: "50%",
                            backgroundColor: element.style.fill || "#3b82f6",
                            border: borderStyle,
                            opacity: element.style.opacity ?? 1,
                          }}
                        />
                      );
                    }
                    return (
                      <div
                        key={element.id}
                        style={{
                          ...elementStyle,
                          backgroundColor: element.style.fill || "#3b82f6",
                          border: borderStyle,
                          opacity: element.style.opacity ?? 1,
                        }}
                      />
                    );

                  case "video":
                    return (
                      <video
                        key={element.id}
                        src={element.content || ""}
                        controls
                        style={elementStyle}
                      />
                    );

                  default:
                    return null;
                }
              })}
            </div>
          );
        })}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-900/90 backdrop-blur-xl rounded-full px-6 py-3 border border-gray-800/50 shadow-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousFrame}
          disabled={currentIndex <= 0}
          className="text-gray-300 hover:text-white hover:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <span className="text-sm font-medium text-white min-w-[80px] text-center tabular-nums">
          {currentIndex + 1} / {path.length}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextFrame}
          disabled={currentIndex >= path.length - 1}
          className="text-gray-300 hover:text-white hover:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Exit button */}
      <div className="absolute top-6 right-6 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="text-gray-300 hover:text-white hover:bg-gray-800/50 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 transition-all"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

