"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, Text, IText, Circle, Image, Point, type TEvent, type Object as FabricObject } from "fabric";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";

interface WYSIWYGCanvasProps {
  frameId: string;
  width: number;
  height: number;
}

export function WYSIWYGCanvas({ frameId, width, height }: WYSIWYGCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  const {
    frames,
    tool,
    addElement,
    updateElement,
    selectElement,
    selectedElementId,
    selectedFrameId,
    updateFrame,
  } = usePresentationEditorStore();

  const frame = frames.find((f) => f.id === frameId);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: frame?.backgroundColor || "#ffffff",
      selection: tool === "select",
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height, frame?.backgroundColor]);

  // Update canvas background when frame changes
  useEffect(() => {
    if (!canvas || !frame) return;
    canvas.backgroundColor = frame.backgroundColor || "#ffffff";
    canvas.renderAll();
  }, [canvas, frame?.backgroundColor]);

  // Render elements
  useEffect(() => {
    if (!canvas) return;
    
    if (!frame) {
      // Clear canvas if no frame
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      return;
    }

    // Clear existing objects
    canvas.clear();
    canvas.backgroundColor = frame.backgroundColor || "#ffffff";

    // Render elements
    frame.elements.forEach((element) => {
      let fabricObj: FabricObject | null = null;

      switch (element.type) {
        case "text":
          fabricObj = new IText(element.content || "Text", {
            left: element.position.x,
            top: element.position.y,
            fontSize: element.style?.fontSize || 24,
            fontFamily: element.style?.fontFamily || "Arial",
            fill: element.style?.fill || "#000000",
            width: element.size.width,
            height: element.size.height,
            editable: true,
          });
          break;
        case "shape":
          // Determine shape type from content or default to rect
          const shapeType = element.content || "rect";
          if (shapeType === "circle") {
            fabricObj = new Circle({
              left: element.position.x,
              top: element.position.y,
              radius: element.size.width / 2,
              fill: element.style?.fill || "#3b82f6",
              stroke: element.style?.stroke || "#000000",
              strokeWidth: element.style?.strokeWidth || 0,
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
            });
          }
          break;
        case "image":
          if (element.content) {
            Image.fromURL(element.content, (img) => {
              img.set({
                left: element.position.x,
                top: element.position.y,
                scaleX: element.size.width / (img.width || 1),
                scaleY: element.size.height / (img.height || 1),
              });
              (img as any).elementId = element.id;
              (img as any).frameId = frameId;
              canvas.add(img);
              canvas.renderAll();
            });
          }
          break;
      }

      if (fabricObj) {
        (fabricObj as any).elementId = element.id;
        (fabricObj as any).frameId = frameId;

        // Handle selection
        fabricObj.on("selected", () => {
          selectElement(frameId, element.id);
        });

        // Handle modification
        fabricObj.on("modified", () => {
          updateElement(frameId, element.id, {
            position: {
              x: fabricObj!.left || 0,
              y: fabricObj!.top || 0,
            },
            size: {
              width: (fabricObj!.width || 0) * (fabricObj!.scaleX || 1),
              height: (fabricObj!.height || 0) * (fabricObj!.scaleY || 1),
            },
          });
        });

        // Handle text editing
        if (fabricObj instanceof IText) {
          fabricObj.on("changed", () => {
            updateElement(frameId, element.id, {
              content: (fabricObj as IText).text,
            });
          });
        }

        canvas.add(fabricObj);
      }
    });

    canvas.renderAll();
  }, [canvas, frame, frameId, selectElement, updateElement, tool]);

  // Handle tool changes - create elements on click
  useEffect(() => {
    if (!canvas || tool === "select") return;

    const handleMouseDown = (opt: TEvent<MouseEvent>) => {
      // Don't create if clicking on an existing object
      const target = opt.target;
      if (target && target !== canvas) {
        return;
      }

      const pointer = canvas.getPointer(opt.e);
      
      if (tool === "text") {
        const text = new IText("Click to edit", {
          left: pointer.x,
          top: pointer.y,
          fontSize: 24,
          fontFamily: "Arial",
          fill: "#000000",
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();

        const elementId = addElement(frameId, {
          type: "text",
          position: { x: pointer.x, y: pointer.y },
          size: { width: 200, height: 50 },
          rotation: 0,
          content: "Click to edit",
          style: {
            fill: "#000000",
            fontSize: 24,
            fontFamily: "Arial",
          },
        });
      } else if (tool === "shape") {
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 100,
          height: 100,
          fill: "#3b82f6",
        });

        canvas.add(rect);
        canvas.setActiveObject(rect);

        const elementId = addElement(frameId, {
          type: "shape",
          position: { x: pointer.x, y: pointer.y },
          size: { width: 100, height: 100 },
          rotation: 0,
          content: "rect",
          style: {
            fill: "#3b82f6",
            stroke: "#000000",
            strokeWidth: 0,
          },
        });
      } else if (tool === "image") {
        // Trigger image upload dialog
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event: any) => {
              const imageUrl = event.target.result;
              Image.fromURL(imageUrl, (img) => {
                img.set({
                  left: pointer.x,
                  top: pointer.y,
                  scaleX: 0.5,
                  scaleY: 0.5,
                });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();

                const elementId = addElement(frameId, {
                  type: "image",
                  position: { x: pointer.x, y: pointer.y },
                  size: { width: img.width || 200, height: img.height || 200 },
                  rotation: 0,
                  content: imageUrl,
                  style: {},
                });
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    };

    canvas.on("mouse:down", handleMouseDown);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
    };
  }, [canvas, tool, frameId, addElement]);

  // Highlight selected element
  useEffect(() => {
    if (!canvas) return;

    if (selectedElementId) {
      const objects = canvas.getObjects();
      const obj = objects.find((o) => (o as any).elementId === selectedElementId);
      if (obj) {
        canvas.setActiveObject(obj);
        canvas.renderAll();
      }
    } else {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [canvas, selectedElementId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected element
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId && frame) {
        e.preventDefault();
        const { deleteElement } = usePresentationEditorStore.getState();
        deleteElement(frameId, selectedElementId);
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvas, selectedElementId, frameId, frame]);

  if (!frame) {
    return (
      <div
        className="relative bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-400">No slide selected</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

