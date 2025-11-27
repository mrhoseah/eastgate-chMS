"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, IText, Circle, Image, Triangle, Ellipse, Line, Polygon, type TEvent, type Object as FabricObject, Group } from "fabric";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import { FontFamily } from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Palette,
  Type,
  Highlighter,
  Grid3x3,
  Layers,
  MoveUp,
  MoveDown,
  ChevronUp,
  ChevronDown,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
} from "lucide-react";

interface EnhancedWYSIWYGCanvasProps {
  frameId: string;
  width: number;
  height: number;
  selectedShapeType?: string;
}

export function EnhancedWYSIWYGCanvas({ frameId, width, height, selectedShapeType = "rect" }: EnhancedWYSIWYGCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textEditorRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [editingTextElement, setEditingTextElement] = useState<{ elementId: string; fabricObj: IText } | null>(null);
  const [textEditorPosition, setTextEditorPosition] = useState({ x: 0, y: 0 });
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);

  const {
    frames,
    tool,
    addElement,
    updateElement,
    selectElement,
    selectedElementId,
    updateFrame,
  } = usePresentationEditorStore();

  const frame = frames.find((f) => f.id === frameId);
  
  // Debug: Log when frame changes
  useEffect(() => {
    if (frameId) {
      console.log('Canvas frame changed:', { frameId, frameFound: !!frame, elementsCount: frame?.elements?.length || 0 });
    }
  }, [frameId, frame]);

  // Tiptap editor for rich text editing with full features
  const textEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ["textStyle"],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Underline,
      Strike,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: "",
    immediatelyRender: false, // Required for SSR compatibility
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none p-4 min-h-[100px] max-h-[300px] overflow-y-auto",
      },
    },
    onUpdate: ({ editor }) => {
      if (editingTextElement && canvas) {
        const html = editor.getHTML();
        const plainText = editor.getText();
        
        // Update the fabric text object immediately to prevent disappearing
        if (editingTextElement.fabricObj instanceof IText) {
          editingTextElement.fabricObj.set("text", plainText);
          editingTextElement.fabricObj.setCoords();
        }
        
        canvas.renderAll();
        
        // Update the store
        updateElement(frameId, editingTextElement.elementId, {
          content: html,
        });
      }
    },
  });

  // Initialize canvas - only create once, don't recreate on frame change
  useEffect(() => {
    if (!canvasRef.current || canvas) return; // Don't recreate if canvas already exists

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: frame?.backgroundColor || "#ffffff",
      selection: true, // Always allow selection for editing
      preserveObjectStacking: true,
      stateful: true,
      interactive: true, // Ensure canvas is interactive
      allowTouchScrolling: false, // Prevent touch scrolling on mobile
      enableRetinaScaling: true, // Better rendering quality
    });
    
    // Ensure canvas is always editable
    fabricCanvas.hoverCursor = 'move';
    fabricCanvas.moveCursor = 'move';
    fabricCanvas.defaultCursor = 'default';

    // Grid rendering - use overlay canvas approach
    const gridOverlay = document.createElement('canvas');
    gridOverlay.width = width;
    gridOverlay.height = height;
    gridOverlay.style.position = 'absolute';
    gridOverlay.style.top = '0';
    gridOverlay.style.left = '0';
    gridOverlay.style.pointerEvents = 'none';
    gridOverlay.style.zIndex = '0'; // Ensure grid is behind canvas interaction layer
    if (containerRef.current) {
      containerRef.current.appendChild(gridOverlay);
    }

    // Ensure canvas container is above grid
    if (fabricCanvas.getElement().parentNode) {
      (fabricCanvas.getElement().parentNode as HTMLElement).style.zIndex = '1';
    }

    const drawGrid = () => {
      const ctx = gridOverlay.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);
      
      if (!showGrid) return;
      
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 0.5;
      
      // Draw vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    // Initial grid draw
    drawGrid();

    // Enable better controls with multi-select support
    fabricCanvas.on("selection:created", (e) => {
      const activeObjects = e.selected || [];
      if (activeObjects.length === 1) {
        const activeObject = activeObjects[0];
        if (activeObject && (activeObject as any).elementId) {
          selectElement(frameId, (activeObject as any).elementId);
        }
      } else if (activeObjects.length > 1) {
        // Multi-select
        const elementIds = activeObjects
          .map((obj) => (obj as any).elementId)
          .filter((id) => id);
        if (elementIds.length > 0) {
          const { selectElements } = usePresentationEditorStore.getState();
          selectElements(frameId, elementIds);
        }
      }
    });

    fabricCanvas.on("selection:updated", (e) => {
      const activeObjects = e.selected || [];
      if (activeObjects.length === 1) {
        const activeObject = activeObjects[0];
        if (activeObject && (activeObject as any).elementId) {
          selectElement(frameId, (activeObject as any).elementId);
        }
      } else if (activeObjects.length > 1) {
        // Multi-select
        const elementIds = activeObjects
          .map((obj) => (obj as any).elementId)
          .filter((id) => id);
        if (elementIds.length > 0) {
          const { selectElements } = usePresentationEditorStore.getState();
          selectElements(frameId, elementIds);
        }
      }
    });

    fabricCanvas.on("selection:cleared", () => {
      selectElement(frameId, null);
      setEditingTextElement(null);
      if (textEditor) {
        textEditor.commands.setContent("");
      }
    });
    
    // Enable multi-select with Shift key
    fabricCanvas.on("mouse:down", (e) => {
      if (e.e.shiftKey && e.target) {
        const target = e.target as FabricObject;
        if ((target as any).elementId) {
          const activeObjects = fabricCanvas.getActiveObjects();
          if (activeObjects.length > 0 && !activeObjects.includes(target)) {
            fabricCanvas.setActiveObject(new Group([...activeObjects, target], {
              left: 0,
              top: 0,
            }));
            fabricCanvas.renderAll();
          }
        }
      }
    });

    setCanvas(fabricCanvas);

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
      if (gridOverlay && gridOverlay.parentNode) {
        gridOverlay.parentNode.removeChild(gridOverlay);
      }
    };
  }, [width, height]); // Only recreate if dimensions change

  // Update canvas background when frame changes
  useEffect(() => {
    if (!canvas || !frame) return;
    
    // Check if backgroundColor is an image URL (starts with data: or http)
    const bg = frame.backgroundColor || "#ffffff";
    if (bg.startsWith('data:') || bg.startsWith('http://') || bg.startsWith('https://')) {
      // Set as background image
      Image.fromURL(bg).then((img) => {
        img.scaleToWidth(canvas.width || 800);
        img.scaleToHeight(canvas.height || 600);
        canvas.backgroundImage = img;
        canvas.renderAll();
      }).catch((err) => {
        console.error("Error loading background image:", err);
      });
    } else {
      // Set as solid color
      canvas.backgroundColor = bg;
      canvas.renderAll();
    }
  }, [canvas, frame?.backgroundColor]);

  // Update grid rendering when grid settings change
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    
    const gridOverlay = containerRef.current.querySelector('canvas[data-grid-overlay]') as HTMLCanvasElement;
    if (!gridOverlay) {
      // Create grid overlay if it doesn't exist
      const newGridOverlay = document.createElement('canvas');
      newGridOverlay.width = width;
      newGridOverlay.height = height;
      newGridOverlay.setAttribute('data-grid-overlay', 'true');
      newGridOverlay.style.position = 'absolute';
      newGridOverlay.style.top = '0';
      newGridOverlay.style.left = '0';
      newGridOverlay.style.pointerEvents = 'none';
      newGridOverlay.style.zIndex = '0'; // Ensure grid is behind canvas interaction layer
      containerRef.current.appendChild(newGridOverlay);
      
      const drawGrid = () => {
        const ctx = newGridOverlay.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, width, height);
        
        if (!showGrid) return;
        
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      };
      
      drawGrid();
    } else {
      const ctx = gridOverlay.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);
      
      if (!showGrid) return;
      
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 0.5;
      
      // Draw vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }, [canvas, showGrid, gridSize, width, height]);

  // Render elements - update when frame or frameId changes
  useEffect(() => {
    if (!canvas) {
      console.log('Canvas not ready yet');
      return;
    }
    
    if (!frame) {
      console.log('No frame found for frameId:', frameId);
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      return;
    }

    console.log('Rendering frame:', {
      frameId,
      frameTitle: frame.title,
      elementsCount: frame.elements?.length || 0,
      elements: frame.elements
    });

    // Get existing objects and map them by elementId
    const existingObjects = canvas.getObjects();
    const existingElementsMap = new Map<string, FabricObject>();
    existingObjects.forEach((obj) => {
      const elementId = (obj as any).elementId;
      const objFrameId = (obj as any).frameId;
      // Only track objects that belong to this frame
      if (elementId && objFrameId === frameId) {
        existingElementsMap.set(elementId, obj);
      } else if (!objFrameId || objFrameId !== frameId) {
        // Remove objects from other frames
        canvas.remove(obj);
      }
    });

    canvas.backgroundColor = frame.backgroundColor || "#ffffff";

    // Remove elements that no longer exist in the frame
    existingElementsMap.forEach((obj, elementId) => {
      const elementExists = frame.elements.some((el) => el.id === elementId);
      if (!elementExists) {
        canvas.remove(obj);
      }
    });

    // Render elements for this frame
    if (!frame.elements || frame.elements.length === 0) {
      console.log('No elements to render for frame:', frameId);
      canvas.renderAll();
      return;
    }

    frame.elements.forEach((element) => {
      console.log('Rendering element:', { type: element.type, id: element.id, position: element.position });
      
      // Check if element already exists on canvas
      const existingObj = existingElementsMap.get(element.id);
      if (existingObj && !editingTextElement) {
        // Update existing object properties instead of recreating
        const needsUpdate = 
          existingObj.left !== element.position.x ||
          existingObj.top !== element.position.y ||
          (existingObj as any).angle !== element.rotation;
        
        if (needsUpdate) {
          existingObj.set({
            left: element.position.x,
            top: element.position.y,
            angle: element.rotation,
          });
          existingObj.setCoords();
        }

        // Update size if changed
        if (element.type === 'shape') {
            const shapeType = element.content || "rect";
            if (shapeType === 'circle') {
                if ((existingObj as Circle).radius !== element.size.width / 2) {
                    (existingObj as Circle).set('radius', element.size.width / 2);
                    existingObj.setCoords();
                }
            } else if (shapeType === 'ellipse') {
                 if ((existingObj as Ellipse).rx !== element.size.width / 2 || (existingObj as Ellipse).ry !== element.size.height / 2) {
                    (existingObj as Ellipse).set({
                        rx: element.size.width / 2,
                        ry: element.size.height / 2
                    });
                    existingObj.setCoords();
                 }
            } else if (shapeType === 'rect' || shapeType === 'triangle' || !shapeType) {
                 if (existingObj.width !== element.size.width || existingObj.height !== element.size.height) {
                    existingObj.set({
                        width: element.size.width,
                        height: element.size.height
                    });
                    existingObj.setCoords();
                 }
            }
        } else if (element.type === 'text') {
             if (Math.abs((existingObj.width || 0) - element.size.width) > 1 || Math.abs((existingObj.height || 0) - element.size.height) > 1) {
                 existingObj.set({
                     width: element.size.width,
                     height: element.size.height
                 });
                 existingObj.setCoords();
             }
        }

        // Update text content and styles if it's a text element
        if (existingObj instanceof IText && element.type === 'text') {
          const currentText = existingObj.text || '';
          const newText = element.content 
            ? element.content.replace(/<[^>]*>/g, '').trim()
            : '';
          if (currentText !== newText && newText) {
            existingObj.set('text', newText);
          }
          
          // Update text specific styles
          if (element.style) {
            if (element.style.fontSize && existingObj.fontSize !== element.style.fontSize) {
              existingObj.set('fontSize', element.style.fontSize);
            }
            if (element.style.fontFamily && existingObj.fontFamily !== element.style.fontFamily) {
              existingObj.set('fontFamily', element.style.fontFamily);
            }
          }
        }

        // Update common styles for all elements (shapes and text)
        if (element.style) {
          if (element.style.fill && existingObj.fill !== element.style.fill) {
            existingObj.set('fill', element.style.fill);
          }
          if (element.style.stroke && existingObj.stroke !== element.style.stroke) {
            existingObj.set('stroke', element.style.stroke);
          }
          if (element.style.strokeWidth !== undefined && existingObj.strokeWidth !== element.style.strokeWidth) {
            existingObj.set('strokeWidth', element.style.strokeWidth);
          }
          if (element.style.opacity !== undefined && existingObj.opacity !== element.style.opacity) {
            existingObj.set('opacity', element.style.opacity);
          }
        }
        
        existingObj.setCoords();
        canvas.requestRenderAll();
        
        return; // Skip creating new object
      }
      
      let fabricObj: FabricObject | null = null;

      switch (element.type) {
        case "text":
          // Create text with better styling
          // Extract plain text from HTML if content is HTML
          let textContent = element.content || "Double click to edit";
          if (typeof textContent === 'string' && textContent.includes('<')) {
            // Strip HTML tags to get plain text for display
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = textContent;
            textContent = tempDiv.textContent || tempDiv.innerText || "Double click to edit";
          }
          if (!textContent || textContent.trim() === '') {
            textContent = "Double click to edit";
          }
          console.log('Creating text element:', { content: textContent, originalContent: element.content });
          fabricObj = new IText(textContent, {
            left: element.position.x,
            top: element.position.y,
            fontSize: element.style?.fontSize || 24,
            fontFamily: element.style?.fontFamily || "Arial",
            fill: element.style?.fill || "#000000",
            width: element.size.width || 200,
            height: element.size.height || 50,
            editable: false, // We'll use Tiptap for editing
            selectable: true,
            evented: true, // Ensure it can receive events
            hasControls: true,
            hasBorders: true,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            cornerSize: 10,
            transparentCorners: false,
            hoverCursor: 'move',
            moveCursor: 'move',
          });

          // Double click to edit with Tiptap - ensure it always works
          fabricObj.on("mousedblclick", (e) => {
            e.e?.stopPropagation?.(); // Prevent event bubbling
            if (fabricObj instanceof IText) {
              console.log('Double-click detected on text element:', element.id);
              setEditingTextElement({ elementId: element.id, fabricObj });
              if (textEditor) {
                // Use the actual HTML content if available, otherwise plain text
                const content = element.content || fabricObj.text || "";
                textEditor.commands.setContent(content);
                
                // Apply styles from element.style
                if (element.style) {
                  if (element.style.fontFamily) {
                    textEditor.chain().focus().setFontFamily(element.style.fontFamily).run();
                  }
                  if (element.style.fontSize) {
                    textEditor.chain().focus().setFontSize(element.style.fontSize + "px").run();
                  }
                  if (element.style.fill) {
                    textEditor.chain().focus().setColor(element.style.fill).run();
                    setTextColor(element.style.fill);
                  }
                }
              }
              setTextEditorPosition({
                x: element.position.x,
                y: element.position.y,
              });
              // Focus the text editor after a short delay
              setTimeout(() => {
                if (textEditorRef.current) {
                  const editorElement = textEditorRef.current.querySelector('.ProseMirror');
                  if (editorElement) {
                    (editorElement as HTMLElement).focus();
                  }
                }
              }, 100);
            }
          });
          
          // Single click to select (for editing properties)
          fabricObj.on("mousedown", (e) => {
            // Select the element when clicked
            if (fabricObj && (fabricObj as any).elementId) {
              selectElement(frameId, (fabricObj as any).elementId);
            }
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
              selectable: true,
              hasControls: true,
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
              selectable: true,
              hasControls: true,
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
              selectable: true,
              hasControls: true,
            });
          } else if (shapeType === "line") {
            fabricObj = new Line([
              element.position.x,
              element.position.y,
              element.position.x + element.size.width,
              element.position.y + element.size.height
            ], {
              stroke: element.style?.fill || element.style?.stroke || "#3b82f6",
              strokeWidth: element.style?.strokeWidth || 3,
              selectable: true,
              hasControls: true,
            });
          } else if (shapeType === "arrow") {
            const arrowPoints = [
              { x: element.position.x, y: element.position.y },
              { x: element.position.x + element.size.width * 0.8, y: element.position.y },
              { x: element.position.x + element.size.width * 0.8, y: element.position.y - 10 },
              { x: element.position.x + element.size.width, y: element.position.y },
              { x: element.position.x + element.size.width * 0.8, y: element.position.y + 10 },
              { x: element.position.x + element.size.width * 0.8, y: element.position.y },
            ];
            fabricObj = new Polygon(arrowPoints, {
              fill: element.style?.fill || "#3b82f6",
              stroke: element.style?.stroke || "#000000",
              strokeWidth: element.style?.strokeWidth || 0,
              selectable: true,
              hasControls: true,
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
              rx: 0,
              ry: 0,
              selectable: true,
              hasControls: true,
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
                selectable: true,
                hasControls: true,
              });
              (img as any).elementId = element.id;
              (img as any).frameId = frameId;
              canvas.add(img);
              canvas.renderAll();
            }).catch((err) => {
              console.error("Error loading image:", err);
            });
            return; // Skip adding to canvas here since Image.fromURL is async
          }
          break;

        case "chart":
          try {
            const chartData = JSON.parse(element.content || "{}");
            // Create a container div for the chart (will be rendered as image)
            // For now, create a styled rectangle placeholder
            const chartRect = new Rect({
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              fill: "#ffffff",
              stroke: "#3b82f6",
              strokeWidth: 2,
              rx: 4,
              ry: 4,
              selectable: true,
              hasControls: true,
            });
            (chartRect as any).elementId = element.id;
            (chartRect as any).frameId = frameId;
            (chartRect as any).chartData = chartData;
            (chartRect as any).elementType = "chart";
            fabricObj = chartRect;
            // Note: Actual chart rendering would require converting React component to image
            // For now, we use a placeholder that can be enhanced later
          } catch (e) {
            console.error("Error parsing chart data:", e);
          }
          break;

        case "table":
          try {
            const tableData = JSON.parse(element.content || "{}");
            // Create table as a group of rectangles
            const tableCells: FabricObject[] = [];
            const cellWidth = element.size.width / (tableData.cols || 3);
            const cellHeight = element.size.height / (tableData.rows || 3);
            
            for (let row = 0; row < (tableData.rows || 3); row++) {
              for (let col = 0; col < (tableData.cols || 3); col++) {
                const cell = new Rect({
                  left: col * cellWidth,
                  top: row * cellHeight,
                  width: cellWidth,
                  height: cellHeight,
                  fill: row === 0 ? "#e5e7eb" : "#ffffff",
                  stroke: "#d1d5db",
                  strokeWidth: 1,
                  selectable: false,
                });
                tableCells.push(cell);
              }
            }
            
            const tableGroup = new Group(tableCells, {
              left: element.position.x,
              top: element.position.y,
              selectable: true,
              hasControls: true,
            });
            (tableGroup as any).elementId = element.id;
            (tableGroup as any).frameId = frameId;
            (tableGroup as any).tableData = tableData;
            (tableGroup as any).elementType = "table";
            fabricObj = tableGroup;
          } catch (e) {
            console.error("Error parsing table data:", e);
          }
          break;
      }

      if (fabricObj) {
        (fabricObj as any).elementId = element.id;
        (fabricObj as any).frameId = frameId;

        // Handle object modification - only update when modification is complete
        fabricObj.on("modified", () => {
          const width = (fabricObj!.width || 0) * (fabricObj!.scaleX || 1);
          const height = (fabricObj!.height || 0) * (fabricObj!.scaleY || 1);
          
          updateElement(frameId, element.id, {
            position: {
              x: fabricObj!.left || 0,
              y: fabricObj!.top || 0,
            },
            size: {
              width,
              height,
            },
            rotation: fabricObj!.angle || 0,
          });
          
          // Reset scale after updating size
          if (fabricObj!.scaleX !== 1 || fabricObj!.scaleY !== 1) {
            fabricObj!.set({
              scaleX: 1,
              scaleY: 1,
              width,
              height,
            });
            fabricObj!.setCoords();
          }
        });

        // Handle object moving - update in real-time with snap-to-grid
        fabricObj.on("moving", () => {
          if (snapToGrid) {
            const snappedX = Math.round((fabricObj!.left || 0) / gridSize) * gridSize;
            const snappedY = Math.round((fabricObj!.top || 0) / gridSize) * gridSize;
            fabricObj!.set({
              left: snappedX,
              top: snappedY,
            });
            fabricObj!.setCoords();
          }
          updateElement(frameId, element.id, {
            position: {
              x: fabricObj!.left || 0,
              y: fabricObj!.top || 0,
            },
          });
        });

        // Handle object scaling - update in real-time
        fabricObj.on("scaling", () => {
          updateElement(frameId, element.id, {
            size: {
              width: (fabricObj!.width || 0) * (fabricObj!.scaleX || 1),
              height: (fabricObj!.height || 0) * (fabricObj!.scaleY || 1),
            },
          });
        });

        // Handle object rotating - update in real-time
        fabricObj.on("rotating", () => {
          updateElement(frameId, element.id, {
            rotation: fabricObj!.angle || 0,
          });
        });

        canvas.add(fabricObj);
        console.log('Added fabric object to canvas:', { 
          type: element.type, 
          id: element.id,
          left: fabricObj.left,
          top: fabricObj.top,
          visible: fabricObj.visible
        });
      } else {
        console.warn('Failed to create fabric object for element:', element);
      }
    });

    const objectCount = canvas.getObjects().length;
    console.log('Canvas objects after rendering:', objectCount);
    if (objectCount === 0 && frame.elements.length > 0) {
      console.error('WARNING: No objects were added to canvas despite having elements!');
    }
    canvas.renderAll();
  }, [canvas, frame, frameId, updateElement, selectElement, frame?.elements?.length, editingTextElement]);

  // Handle tool changes - create elements on click
  useEffect(() => {
    if (!canvas) return;

    // Reset canvas selection mode based on tool
    if (tool === "select") {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.moveCursor = 'move';
      // Make all objects selectable and editable
      canvas.getObjects().forEach((obj) => {
        obj.selectable = true;
        obj.evented = true;
        obj.hoverCursor = 'move';
        obj.moveCursor = 'move';
        // Ensure text objects can be double-clicked
        if (obj instanceof IText) {
          obj.editable = false; // We use Tiptap, but allow interaction
        }
      });
      canvas.renderAll();
      return;
    }

    // Set canvas to non-selection mode for creation tools
    // BUT keep objects selectable so they can still be edited
    canvas.selection = false; // Disable new selections
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    // Keep objects selectable and editable even in creation mode
    // This allows users to edit existing objects while creating new ones
    canvas.getObjects().forEach((obj) => {
      obj.selectable = true; // Keep selectable for editing
      obj.evented = true; // Keep evented for interactions
    });
    canvas.renderAll();

    const handleMouseDown = (opt: any) => {
      const target = opt.target;
      if (target && target !== canvas) {
        return;
      }

      const pointer = canvas.getPointer(opt.e);
      
      // Apply snap-to-grid if enabled
      let x = pointer.x;
      let y = pointer.y;
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      
      if (tool === "text") {
        const text = new IText("Double click to edit", {
          left: x,
          top: y,
          fontSize: 24,
          fontFamily: "Arial",
          fill: "#000000",
          editable: false,
          selectable: true,
          hasControls: true,
        });

        canvas.add(text);
        canvas.setActiveObject(text);

        const elementId = addElement(frameId, {
          type: "text",
          position: { x, y },
          size: { width: 200, height: 50 },
          rotation: 0,
          content: "Double click to edit",
          style: {
            fill: "#000000",
            fontSize: 24,
            fontFamily: "Arial",
          },
        });

        (text as any).elementId = elementId;
        (text as any).frameId = frameId;
        
        // Switch back to select tool after creating element
        const { setTool } = usePresentationEditorStore.getState();
        setTool("select");
      } else if (tool === "shape") {
        // Use selectedShapeType prop
        const shapeType = selectedShapeType || "rect";
        let shapeObj: FabricObject | null = null;

        if (shapeType === "circle") {
          shapeObj = new Circle({
            left: x,
            top: y,
            radius: 50,
            fill: "#3b82f6",
            selectable: true,
            hasControls: true,
          });
        } else if (shapeType === "triangle") {
          shapeObj = new Triangle({
            left: x,
            top: y,
            width: 100,
            height: 100,
            fill: "#3b82f6",
            selectable: true,
            hasControls: true,
          });
        } else if (shapeType === "ellipse") {
          shapeObj = new Ellipse({
            left: x,
            top: y,
            rx: 50,
            ry: 30,
            fill: "#3b82f6",
            selectable: true,
            hasControls: true,
          });
        } else if (shapeType === "line") {
          const endX = snapToGrid ? Math.round((x + 100) / gridSize) * gridSize : x + 100;
          shapeObj = new Line([x, y, endX, y], {
            stroke: "#3b82f6",
            strokeWidth: 3,
            selectable: true,
            hasControls: true,
          });
        } else if (shapeType === "arrow") {
          // Create arrow using polygon
          const endX = snapToGrid ? Math.round((x + 100) / gridSize) * gridSize : x + 100;
          const arrowPoints = [
            { x, y },
            { x: endX - 20, y },
            { x: endX - 20, y: y - 10 },
            { x: endX, y },
            { x: endX - 20, y: y + 10 },
            { x: endX - 20, y },
          ];
          shapeObj = new Polygon(arrowPoints, {
            fill: "#3b82f6",
            stroke: "#3b82f6",
            strokeWidth: 2,
            selectable: true,
            hasControls: true,
          });
        } else {
          // Default to rectangle
          shapeObj = new Rect({
            left: x,
            top: y,
            width: 100,
            height: 100,
            fill: "#3b82f6",
            selectable: true,
            hasControls: true,
          });
        }

        canvas.add(shapeObj);
        canvas.setActiveObject(shapeObj);

        const elementId = addElement(frameId, {
          type: "shape",
          position: { x, y },
          size: { 
            width: shapeType === "circle" || shapeType === "ellipse" ? 100 : shapeType === "line" || shapeType === "arrow" ? 100 : 100,
            height: shapeType === "circle" ? 100 : shapeType === "ellipse" ? 60 : shapeType === "line" || shapeType === "arrow" ? 0 : 100
          },
          rotation: 0,
          content: shapeType,
          style: {
            fill: shapeType === "line" ? "transparent" : "#3b82f6",
            stroke: shapeType === "line" ? "#3b82f6" : "#000000",
            strokeWidth: shapeType === "line" ? 3 : 0,
          },
        });

        (shapeObj as any).elementId = elementId;
        (shapeObj as any).frameId = frameId;
        
        // Switch back to select tool after creating element
        const { setTool } = usePresentationEditorStore.getState();
        setTool("select");
      } else if (tool === "image") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event: any) => {
              const imageUrl = event.target.result;
              Image.fromURL(imageUrl).then((img: any) => {
                img.set({
                  left: x,
                  top: y,
                  scaleX: 0.5,
                  scaleY: 0.5,
                  selectable: true,
                  hasControls: true,
                });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();

                const elementId = addElement(frameId, {
                  type: "image",
                  position: { x, y },
                  size: { width: img.width || 200, height: img.height || 200 },
                  rotation: 0,
                  content: imageUrl,
                  style: {},
                });

                (img as any).elementId = elementId;
                (img as any).frameId = frameId;
                
                // Switch back to select tool after creating element
                const { setTool } = usePresentationEditorStore.getState();
                setTool("select");
              }).catch((err) => {
                console.error("Error loading image:", err);
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
  }, [canvas, tool, frameId, addElement, selectedShapeType, snapToGrid, gridSize]);

  // Handle keyboard shortcuts and element deletion
  useEffect(() => {
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs or text editor
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          editingTextElement) {
        return;
      }

      // Delete element
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId && frame) {
        e.preventDefault();
        const { deleteElement, selectElement } = usePresentationEditorStore.getState();
        
        // Find and remove the fabric object
        const objects = canvas.getObjects();
        const fabricObj = objects.find((obj: any) => obj.elementId === selectedElementId);
        if (fabricObj) {
          canvas.remove(fabricObj);
        }
        
        deleteElement(frameId, selectedElementId);
        selectElement(frameId, null);
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }

      // Layer arrangement shortcuts (only when element is selected)
      if (!selectedElementId) return;

      const obj = canvas.getObjects().find((o: any) => o.elementId === selectedElementId);
      if (!obj) return;

      // Ctrl/Cmd + ] - Bring Forward
      if ((e.ctrlKey || e.metaKey) && e.key === ']' && !e.shiftKey) {
        e.preventDefault();
        canvas.bringForward(obj);
        canvas.renderAll();
        return;
      }

      // Ctrl/Cmd + [ - Send Backward
      if ((e.ctrlKey || e.metaKey) && e.key === '[' && !e.shiftKey) {
        e.preventDefault();
        canvas.sendBackwards(obj);
        canvas.renderAll();
        return;
      }

      // Ctrl/Cmd + Shift + ] - Bring to Front
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']') {
        e.preventDefault();
        canvas.bringToFront(obj);
        canvas.renderAll();
        return;
      }

      // Ctrl/Cmd + Shift + [ - Send to Back
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[') {
        e.preventDefault();
        canvas.sendToBack(obj);
        canvas.renderAll();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvas, selectedElementId, frameId, frame, editingTextElement]);

  if (!frame) {
    return (
      <div
        className="relative bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-2">No slide selected</p>
            <p className="text-xs text-gray-500">Frame ID: {frameId || 'none'}</p>
            <p className="text-xs text-gray-500">Available frames: {frames.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden border border-gray-200"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block',
            cursor: tool === 'select' ? 'default' : 'crosshair',
            touchAction: 'none', // Prevent default touch behaviors
          }} 
        />
        {frame && frame.elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <p className="text-sm text-gray-400 bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded">
              Empty slide - Add content using the toolbar above
            </p>
          </div>
        )}

        {/* Grid and Layer Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
            title={showGrid ? "Hide Grid" : "Show Grid"}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm ${snapToGrid ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
            title={snapToGrid ? "Disable Snap to Grid" : "Enable Snap to Grid"}
          >
            <Grid3x3 className={`w-4 h-4 ${snapToGrid ? 'text-blue-600 dark:text-blue-400' : ''}`} />
          </Button>
          {selectedElementId && canvas && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  title="Arrange Objects"
                >
                  <Layers className="w-4 h-4 mr-1" />
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => {
                    const obj = canvas.getObjects().find((o: any) => o.elementId === selectedElementId);
                    if (obj) {
                      canvas.bringToFront(obj);
                      canvas.renderAll();
                    }
                  }}
                >
                  <MoveUp className="w-4 h-4 mr-2" />
                  <span className="flex-1">Bring to Front</span>
                  <span className="text-xs text-gray-500 ml-2">Ctrl+Shift+]</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const obj = canvas.getObjects().find((o: any) => o.elementId === selectedElementId);
                    if (obj) {
                      canvas.bringForward(obj);
                      canvas.renderAll();
                    }
                  }}
                >
                  <ChevronUp className="w-4 h-4 mr-2" />
                  <span className="flex-1">Bring Forward</span>
                  <span className="text-xs text-gray-500 ml-2">Ctrl+]</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const obj = canvas.getObjects().find((o: any) => o.elementId === selectedElementId);
                    if (obj) {
                      canvas.sendBackwards(obj);
                      canvas.renderAll();
                    }
                  }}
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  <span className="flex-1">Send Backward</span>
                  <span className="text-xs text-gray-500 ml-2">Ctrl+[</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const obj = canvas.getObjects().find((o: any) => o.elementId === selectedElementId);
                    if (obj) {
                      canvas.sendToBack(obj);
                      canvas.renderAll();
                    }
                  }}
                >
                  <MoveDown className="w-4 h-4 mr-2" />
                  <span className="flex-1">Send to Back</span>
                  <span className="text-xs text-gray-500 ml-2">Ctrl+Shift+[</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Rich Text Editor - Full Featured */}
      {editingTextElement && textEditor && (
        <div
          className="absolute z-50 w-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl"
          style={{
            left: `${Math.max(0, textEditorPosition.x)}px`,
            top: `${Math.max(0, textEditorPosition.y + 50)}px`,
          }}
        >
          {/* Toolbar Row 1: Text Formatting */}
          <div className="border-b p-2 flex items-center gap-1 flex-wrap">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().undo().run()}
                disabled={!textEditor.can().undo()}
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().redo().run()}
                disabled={!textEditor.can().redo()}
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={textEditor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""}
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={textEditor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""}
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={textEditor.isActive("heading", { level: 3 }) ? "bg-gray-200" : ""}
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </Button>
            </div>

            {/* Text Style */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleBold().run()}
                className={textEditor.isActive("bold") ? "bg-gray-200" : ""}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleItalic().run()}
                className={textEditor.isActive("italic") ? "bg-gray-200" : ""}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleUnderline().run()}
                className={textEditor.isActive("underline") ? "bg-gray-200" : ""}
                title="Underline"
              >
                <UnderlineIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleStrike().run()}
                className={textEditor.isActive("strike") ? "bg-gray-200" : ""}
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </Button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleBulletList().run()}
                className={textEditor.isActive("bulletList") ? "bg-gray-200" : ""}
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().toggleOrderedList().run()}
                className={textEditor.isActive("orderedList") ? "bg-gray-200" : ""}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().setTextAlign("left").run()}
                className={textEditor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().setTextAlign("center").run()}
                className={textEditor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""}
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().setTextAlign("right").run()}
                className={textEditor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => textEditor.chain().focus().setTextAlign("justify").run()}
                className={textEditor.isActive({ textAlign: "justify" }) ? "bg-gray-200" : ""}
                title="Justify"
              >
                <AlignJustify className="w-4 h-4" />
              </Button>
            </div>

            {/* Link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = textEditor.getAttributes("link").href;
                setLinkUrl(url || "");
                setShowLinkDialog(true);
              }}
              className={textEditor.isActive("link") ? "bg-gray-200" : ""}
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Toolbar Row 2: Colors & Fonts */}
          <div className="border-b p-2 flex items-center gap-2 flex-wrap">
            {/* Font Family */}
            <Select
              value={textEditor.getAttributes("textStyle").fontFamily || "Arial"}
              onValueChange={(value) => {
                textEditor.chain().focus().setFontFamily(value).run();
                if (editingTextElement) {
                  const currentElement = frames.find(f => f.id === frameId)?.elements.find(e => e.id === editingTextElement.elementId);
                  if (currentElement) {
                    updateElement(frameId, editingTextElement.elementId, {
                      style: { ...currentElement.style, fontFamily: value }
                    });
                    // Also update fabric object immediately
                    if (editingTextElement.fabricObj instanceof IText) {
                      editingTextElement.fabricObj.set("fontFamily", value);
                      canvas?.renderAll();
                    }
                  }
                }
              }}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Palatino">Palatino</SelectItem>
                <SelectItem value="Garamond">Garamond</SelectItem>
                <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                <SelectItem value="Impact">Impact</SelectItem>
              </SelectContent>
            </Select>

            {/* Font Size */}
            <Select
              value={String(textEditor.getAttributes("textStyle").fontSize || "16")}
              onValueChange={(value) => {
                textEditor.chain().focus().setFontSize(value + "px").run();
                if (editingTextElement) {
                  const currentElement = frames.find(f => f.id === frameId)?.elements.find(e => e.id === editingTextElement.elementId);
                  if (currentElement) {
                    updateElement(frameId, editingTextElement.elementId, {
                      style: { ...currentElement.style, fontSize: parseInt(value) }
                    });
                    // Also update fabric object immediately
                    if (editingTextElement.fabricObj instanceof IText) {
                      editingTextElement.fabricObj.set("fontSize", parseInt(value));
                      canvas?.renderAll();
                    }
                  }
                }
              }}
            >
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8px</SelectItem>
                <SelectItem value="10">10px</SelectItem>
                <SelectItem value="12">12px</SelectItem>
                <SelectItem value="14">14px</SelectItem>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="18">18px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="24">24px</SelectItem>
                <SelectItem value="28">28px</SelectItem>
                <SelectItem value="32">32px</SelectItem>
                <SelectItem value="36">36px</SelectItem>
                <SelectItem value="48">48px</SelectItem>
                <SelectItem value="64">64px</SelectItem>
                <SelectItem value="72">72px</SelectItem>
              </SelectContent>
            </Select>

            {/* Text Color */}
            <div className="flex items-center gap-1">
              <Palette className="w-4 h-4 text-gray-500" />
              <Input
                type="color"
                value={textColor}
                onChange={(e) => {
                  const color = e.target.value;
                  setTextColor(color);
                  textEditor.chain().focus().setColor(color).run();
                  if (editingTextElement) {
                    const currentElement = frames.find(f => f.id === frameId)?.elements.find(e => e.id === editingTextElement.elementId);
                    if (currentElement) {
                      updateElement(frameId, editingTextElement.elementId, {
                        style: { ...currentElement.style, fill: color }
                      });
                      // Also update fabric object immediately
                      if (editingTextElement.fabricObj instanceof IText) {
                        editingTextElement.fabricObj.set("fill", color);
                        canvas?.renderAll();
                      }
                    }
                  }
                }}
                className="w-10 h-8 p-0 border-0 cursor-pointer"
                title="Text Color"
              />
            </div>

            {/* Highlight Color */}
            <div className="flex items-center gap-1">
              <Highlighter className="w-4 h-4 text-gray-500" />
              <Input
                type="color"
                value={highlightColor}
                onChange={(e) => {
                  setHighlightColor(e.target.value);
                  textEditor.chain().focus().toggleHighlight({ color: e.target.value }).run();
                }}
                className="w-10 h-8 p-0 border-0 cursor-pointer"
                title="Highlight Color"
              />
            </div>
          </div>

          {/* Editor Content */}
          <div ref={textEditorRef} className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto">
            <EditorContent editor={textEditor} />
          </div>

          {/* Footer */}
          <div className="border-t p-2 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {textEditor.storage.characterCount?.characters() || 0} characters
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (editingTextElement && textEditor && canvas) {
                  // Final update before closing to prevent content loss
                  const html = textEditor.getHTML();
                  const plainText = textEditor.getText();
                  
                  if (editingTextElement.fabricObj instanceof IText) {
                    editingTextElement.fabricObj.set("text", plainText);
                    editingTextElement.fabricObj.setCoords();
                  }
                  
                  updateElement(frameId, editingTextElement.elementId, {
                    content: html,
                  });
                  
                  canvas.renderAll();
                }
                setEditingTextElement(null);
                setShowLinkDialog(false);
              }}
            >
              Done
            </Button>
          </div>

          {/* Link Dialog */}
          {showLinkDialog && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-80">
                <h3 className="font-semibold mb-2">Add Link</h3>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (linkUrl) {
                        textEditor.chain().focus().setLink({ href: linkUrl }).run();
                      } else {
                        textEditor.chain().focus().unsetLink().run();
                      }
                      setShowLinkDialog(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      textEditor.chain().focus().unsetLink().run();
                      setShowLinkDialog(false);
                    }}
                  >
                    Remove Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLinkDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

