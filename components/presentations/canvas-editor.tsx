"use client";

import { useEffect, useRef, useCallback } from 'react';
import { Canvas, Rect, Text, IText, Circle, Image, Point, type TEvent, type Object as FabricObject, Shadow, Line, Group } from 'fabric';
import { usePresentationEditorStore, PresentationFrame, PresentationElement } from '@/lib/store/presentation-editor-store';
import { CanvasMinimap } from './canvas-minimap';

interface CanvasEditorProps {
  width?: number;
  height?: number;
  canvasSize?: number; // Virtual canvas size (e.g., 5000x5000)
}

export function CanvasEditor({
  width = 1200,
  height = 800,
  canvasSize = 5000,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const isCreatingFrameRef = useRef(false);
  const frameStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const previewRectRef = useRef<Rect | null>(null);
  const previewTextRef = useRef<Text | null>(null);

  const {
    canvas,
    setCanvas,
    zoom,
    panX,
    panY,
    frames,
    selectedFrameId,
    selectedFrameIds,
    selectedElementId,
    tool,
    setTool,
    selectionMode,
    updateFrame,
    updateElement,
    selectFrame,
    selectFrames,
    selectElement,
    addFrame,
    addElement,
    setZoom,
    setPan,
    setSelectionMode,
    path,
    goToFrame,
  } = usePresentationEditorStore();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Get actual container dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    const actualWidth = containerRect.width || width;
    const actualHeight = containerRect.height || height;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: actualWidth,
      height: actualHeight,
      backgroundColor: '#1a1a1a',
      selection: tool === 'select',
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });

    // Set virtual canvas size
    fabricCanvas.setDimensions({ width: canvasSize, height: canvasSize }, { cssOnly: false });
    
    // Prevent controls from overflowing by clipping
    const clipRect = new Rect({
      left: 0,
      top: 0,
      width: actualWidth,
      height: actualHeight,
      absolutePositioned: true,
      excludeFromExport: true,
    });
    fabricCanvas.clipPath = clipRect;

    // Set background color
    fabricCanvas.backgroundColor = '#1a1a1a';
    
    // Create a subtle grid pattern for better organization
    // Note: Fabric.js doesn't support repeating background images directly,
    // so we'll use CSS background on the container instead
    const gridSize = 40;
    const gridPattern = document.createElement('canvas');
    gridPattern.width = gridSize;
    gridPattern.height = gridSize;
    const ctx = gridPattern.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, gridSize);
      ctx.lineTo(gridSize, gridSize);
      ctx.moveTo(gridSize, 0);
      ctx.lineTo(gridSize, gridSize);
      ctx.stroke();
    }
    
    // Apply grid pattern via CSS on the container (more reliable than Fabric.js background)
    if (containerRef.current) {
      containerRef.current.style.backgroundImage = `url(${gridPattern.toDataURL()})`;
      containerRef.current.style.backgroundRepeat = 'repeat';
      containerRef.current.style.backgroundPosition = '0 0';
    }

    setCanvas(fabricCanvas);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.width;
      const newHeight = rect.height;
      
      fabricCanvas.setDimensions({ width: newWidth, height: newHeight });
      if (fabricCanvas.clipPath) {
        (fabricCanvas.clipPath as Rect).set({ width: newWidth, height: newHeight });
      }
      fabricCanvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      fabricCanvas.dispose();
      setCanvas(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Handle zoom with mouse wheel
  useEffect(() => {
    if (!canvas) return;

    const handleWheel = (opt: { e: WheelEvent }) => {
      const e = opt.e;
      e.preventDefault();
      const delta = e.deltaY;
      const zoomFactor = delta > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

      const pointer = canvas.getPointer(e);
      const zoomPoint = new Point(pointer.x, pointer.y);

      canvas.zoomToPoint(zoomPoint, newZoom);
      setZoom(newZoom);
    };

    canvas.on('mouse:wheel', handleWheel);

    return () => {
      canvas.off('mouse:wheel', handleWheel);
    };
  }, [canvas, zoom]);

  // Handle pan with middle mouse button or space + drag
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: TEvent) => {
      if (e.e && (e.e.button === 1 || (e.e.button === 0 && e.e.ctrlKey))) {
        // Middle mouse button or Ctrl + left click
        isPanningRef.current = true;
        lastPanPointRef.current = canvas.getPointer(e.e);
        canvas.defaultCursor = 'grabbing';
        canvas.selection = false;
      }
    };

    const handleMouseMove = (e: TEvent) => {
      if (isPanningRef.current && lastPanPointRef.current && e.e) {
        const pointer = canvas.getPointer(e.e);
        const deltaX = pointer.x - lastPanPointRef.current.x;
        const deltaY = pointer.y - lastPanPointRef.current.y;

        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          canvas.setViewportTransform(vpt);
          setPan(vpt[4], vpt[5]);
        }

        lastPanPointRef.current = pointer;
      }
    };

    const handleMouseUp = () => {
      isPanningRef.current = false;
      lastPanPointRef.current = null;
      canvas.defaultCursor = 'default';
      canvas.selection = tool === 'select';
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, tool]);

  // Create Fabric.js group for a frame
  const createFrameGroup = useCallback((
    frameId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    if (!canvas) return;

    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;

    // Create frame rectangle with enhanced Prezi-style styling
    const rect = new Rect({
      left: x,
      top: y,
      width,
      height,
      fill: frame.backgroundColor || '#ffffff',
      stroke: '#3b82f6',
      strokeWidth: 2,
      rx: 16,
      ry: 16,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      cornerSize: 14,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#ffffff',
      transparentCorners: false,
      borderColor: '#3b82f6',
      borderScaleFactor: 2,
      shadow: new Shadow({
        color: 'rgba(0, 0, 0, 0.15)',
        blur: 20,
        offsetX: 0,
        offsetY: 8,
      }),
    });

    (rect as any).frameId = frameId;

    // Handle frame selection
    rect.on('selected', (e: TEvent) => {
      setSelectionMode('canvas');
      const isMultiSelect = e.e && (e.e.shiftKey || e.e.ctrlKey || e.e.metaKey);
      
      if (isMultiSelect) {
        // Add to multi-select
        const currentIds = usePresentationEditorStore.getState().selectedFrameIds;
        if (!currentIds.includes(frameId)) {
          usePresentationEditorStore.getState().selectFrames([...currentIds, frameId]);
        }
      } else {
        // Single select
        selectFrame(frameId);
      }
      
      rect.set({
        stroke: '#3b82f6',
        strokeWidth: 3,
        shadow: new Shadow({
          color: 'rgba(59, 130, 246, 0.4)',
          blur: 20,
          offsetX: 0,
          offsetY: 8,
        }),
      });
      canvas.renderAll();
    });

    rect.on('mousedblclick', () => {
      setSelectionMode('external');
      selectFrame(frameId);
    });

    rect.on('deselected', () => {
      rect.set({
        stroke: frame.borderColor || '#e5e7eb',
        strokeWidth: 2,
        shadow: new Shadow({
          color: 'rgba(0, 0, 0, 0.1)',
          blur: 15,
          offsetX: 0,
          offsetY: 6,
        }),
      });
      canvas.renderAll();
    });

    // Handle moving (dragging) with snap-to-grid
    const GRID_SIZE = 40; // Larger grid for better alignment
    const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;
    
    rect.on('moving', () => {
      const snappedX = snapToGrid(rect.left || 0);
      const snappedY = snapToGrid(rect.top || 0);
      rect.set({ left: snappedX, top: snappedY });
      updateFrame(frameId, {
        position: { x: snappedX, y: snappedY },
      });
    });

    // Handle modification
    rect.on('modified', () => {
      updateFrame(frameId, {
        position: { x: rect.left || 0, y: rect.top || 0 },
        width: rect.width || width,
        height: rect.height || height,
        rotation: rect.angle || 0,
      });
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, [canvas, frames, selectFrame, updateFrame]);

  // Handle frame creation with drag-to-resize (Prezi-style)
  useEffect(() => {
    if (!canvas || tool !== 'frame') {
      // Clean up preview if tool changes
      if (previewRectRef.current) {
        canvas.remove(previewRectRef.current);
        previewRectRef.current = null;
      }
      if (previewTextRef.current) {
        canvas.remove(previewTextRef.current);
        previewTextRef.current = null;
      }
      if (previewRectRef.current || previewTextRef.current) {
        canvas.renderAll();
      }
      return;
    }

    const GRID_SIZE = 40; // Snap to 40px grid for better organization
    const MIN_FRAME_SIZE = 240;
    const DEFAULT_ASPECT_RATIO = 16 / 9; // Standard presentation aspect ratio

    const snapToGrid = (value: number) => {
      return Math.round(value / GRID_SIZE) * GRID_SIZE;
    };

    const handleMouseDown = (e: TEvent) => {
      if (!e.e) return;
      
      // Don't create frame if clicking on existing object
      const target = canvas.findTarget(e.e);
      if (target && (target as any).frameId) return;

      const pointer = canvas.getPointer(e.e);
      const snappedX = snapToGrid(pointer.x);
      const snappedY = snapToGrid(pointer.y);

      isCreatingFrameRef.current = true;
      frameStartPointRef.current = { x: snappedX, y: snappedY };

      // Create preview rectangle with better styling
      const previewRect = new Rect({
        left: snappedX,
        top: snappedY,
        width: 0,
        height: 0,
        fill: 'rgba(59, 130, 246, 0.08)',
        stroke: '#3b82f6',
        strokeWidth: 2.5,
        strokeDashArray: [8, 4],
        rx: 16,
        ry: 16,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        shadow: new Shadow({
          color: 'rgba(59, 130, 246, 0.3)',
          blur: 12,
          offsetX: 0,
          offsetY: 4,
        }),
      });
      (previewRect as any).isPreview = true;
      previewRectRef.current = previewRect;
      canvas.add(previewRect);

      // Create size indicator text
      const previewText = new Text('', {
        left: snappedX,
        top: snappedY - 25,
        fontSize: 12,
        fill: '#93c5fd',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 500,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      (previewText as any).isPreview = true;
      previewTextRef.current = previewText;
      canvas.add(previewText);
      canvas.renderAll();
    };

    const handleMouseMove = (e: TEvent) => {
      if (!isCreatingFrameRef.current || !frameStartPointRef.current || !previewRectRef.current || !e.e) return;

      const pointer = canvas.getPointer(e.e);
      const snappedX = snapToGrid(pointer.x);
      const snappedY = snapToGrid(pointer.y);

      const startX = frameStartPointRef.current.x;
      const startY = frameStartPointRef.current.y;

      let width = Math.max(MIN_FRAME_SIZE, Math.abs(snappedX - startX));
      let height = Math.max(MIN_FRAME_SIZE, Math.abs(snappedY - startY));

      // Maintain aspect ratio if holding Shift
      if (e.e.shiftKey) {
        const aspectRatio = width / height;
        if (aspectRatio > DEFAULT_ASPECT_RATIO) {
          height = width / DEFAULT_ASPECT_RATIO;
        } else {
          width = height * DEFAULT_ASPECT_RATIO;
        }
        // Snap to grid
        width = snapToGrid(width);
        height = snapToGrid(height);
      }

      const left = Math.min(startX, snappedX);
      const top = Math.min(startY, snappedY);

      previewRectRef.current.set({
        left,
        top,
        width,
        height,
      });
      previewRectRef.current.setCoords();

      // Update size indicator
      if (previewTextRef.current) {
        const sizeText = `${Math.round(width)} × ${Math.round(height)}`;
        previewTextRef.current.set({
          text: sizeText,
          left: left + width / 2,
          top: top - 28,
        });
        previewTextRef.current.setCoords();
      }

      canvas.renderAll();
    };

    const handleMouseUp = (e: TEvent) => {
      if (!isCreatingFrameRef.current || !frameStartPointRef.current || !previewRectRef.current) {
        isCreatingFrameRef.current = false;
        frameStartPointRef.current = null;
        // Clean up preview text
        if (previewTextRef.current) {
          canvas.remove(previewTextRef.current);
          previewTextRef.current = null;
        }
        return;
      }

      if (!e.e) {
        isCreatingFrameRef.current = false;
        frameStartPointRef.current = null;
        if (previewRectRef.current) {
          canvas.remove(previewRectRef.current);
          previewRectRef.current = null;
        }
        if (previewTextRef.current) {
          canvas.remove(previewTextRef.current);
          previewTextRef.current = null;
        }
        canvas.renderAll();
        return;
      }

      const pointer = canvas.getPointer(e.e);
      const snappedX = snapToGrid(pointer.x);
      const snappedY = snapToGrid(pointer.y);

      const startX = frameStartPointRef.current.x;
      const startY = frameStartPointRef.current.y;

      let width = Math.max(MIN_FRAME_SIZE, Math.abs(snappedX - startX));
      let height = Math.max(MIN_FRAME_SIZE, Math.abs(snappedY - startY));

      // Maintain aspect ratio if holding Shift
      if (e.e.shiftKey) {
        const aspectRatio = width / height;
        if (aspectRatio > DEFAULT_ASPECT_RATIO) {
          height = width / DEFAULT_ASPECT_RATIO;
        } else {
          width = height * DEFAULT_ASPECT_RATIO;
        }
        width = snapToGrid(width);
        height = snapToGrid(height);
      }

      const left = Math.min(startX, snappedX);
      const top = Math.min(startY, snappedY);

      // Remove preview elements
      canvas.remove(previewRectRef.current);
      previewRectRef.current = null;
      if (previewTextRef.current) {
        canvas.remove(previewTextRef.current);
        previewTextRef.current = null;
      }

      // Only create if size is meaningful
      if (width >= MIN_FRAME_SIZE && height >= MIN_FRAME_SIZE) {
        const frameId = addFrame({
          title: `Slide ${frames.length + 1}`,
          position: { x: left, y: top },
          scale: 1,
          rotation: 0,
          width,
          height,
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
        });

        // Create Fabric.js group for the frame with animation
        createFrameGroup(frameId, left, top, width, height);
        
        // Animate frame appearance with scale effect
        const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
        if (frameObj) {
          frameObj.set({ 
            opacity: 0,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          canvas.renderAll();
          frameObj.animate('opacity', 1, {
            duration: 200,
            onChange: () => canvas.renderAll(),
          });
          frameObj.animate('scaleX', 1, {
            duration: 200,
            easing: (t: number, b: number, c: number, d: number) => {
              t /= d;
              return c * t * t * (3 - 2 * t) + b; // Smooth ease
            },
            onChange: () => canvas.renderAll(),
          });
          frameObj.animate('scaleY', 1, {
            duration: 200,
            easing: (t: number, b: number, c: number, d: number) => {
              t /= d;
              return c * t * t * (3 - 2 * t) + b;
            },
            onChange: () => canvas.renderAll(),
            onComplete: () => {
              canvas.setActiveObject(frameObj);
              selectFrame(frameId);
              canvas.renderAll();
            },
          });
        }
      }

      isCreatingFrameRef.current = false;
      frameStartPointRef.current = null;
      
      // Switch back to select tool after creating frame
      setTimeout(() => {
        usePresentationEditorStore.getState().setTool('select');
      }, 100);
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      if (previewRectRef.current) {
        canvas.remove(previewRectRef.current);
        previewRectRef.current = null;
      }
      if (previewTextRef.current) {
        canvas.remove(previewTextRef.current);
        previewTextRef.current = null;
      }
      isCreatingFrameRef.current = false;
      frameStartPointRef.current = null;
      canvas.renderAll();
    };
  }, [canvas, tool, addFrame, createFrameGroup, frames.length]);

  // Create element object on canvas
  const createElementObject = useCallback((
    frameId: string,
    element: PresentationElement
  ) => {
    if (!canvas) return;

    let fabricObj: FabricObject | null = null;

    switch (element.type) {
      case 'text':
        // Get frame position to calculate absolute position
        const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
        const frameLeft = frameObj?.left || 0;
        const frameTop = frameObj?.top || 0;
        
        // Use IText for editable text (IText has enterEditing method)
        fabricObj = new IText(element.content || 'Text', {
          left: frameLeft + element.position.x,
          top: frameTop + element.position.y,
          fontSize: element.style.fontSize || 24,
          fontFamily: element.style.fontFamily || 'Arial',
          fill: element.style.fill || '#000000',
          angle: element.rotation,
          selectable: true,
          hasControls: true,
          cornerSize: 10,
          cornerColor: '#8b5cf6',
          cornerStrokeColor: '#ffffff',
          borderColor: '#8b5cf6',
          editable: true, // Enable text editing
        });
        
        (fabricObj as any).frameId = frameId;
        (fabricObj as any).elementId = element.id;
        
        // Handle text editing
        fabricObj.on('editing:entered', () => {
          canvas.renderAll();
        });
        
        fabricObj.on('editing:exited', () => {
          const textObj = fabricObj as any;
          const newText = textObj.text || '';
          updateElement(frameId, element.id, {
            content: newText,
          });
          canvas.renderAll();
        });
        
        // Handle double-click to edit
        fabricObj.on('mousedblclick', () => {
          if (canvas && fabricObj && (fabricObj as any).enterEditing) {
            canvas.setActiveObject(fabricObj);
            (fabricObj as any).enterEditing();
            canvas.renderAll();
          }
        });
        
        // Handle selection
        fabricObj.on('selected', () => {
          selectElement(frameId, element.id);
          canvas.renderAll();
        });
        
        // Handle modification (position, size, rotation)
        fabricObj.on('modified', () => {
          const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
          const frameLeftAfter = frameObj?.left || 0;
          const frameTopAfter = frameObj?.top || 0;
          
          updateElement(frameId, element.id, {
            position: {
              x: (fabricObj.left || 0) - frameLeftAfter,
              y: (fabricObj.top || 0) - frameTopAfter,
            },
            size: {
              width: (fabricObj.width || 0) * (fabricObj.scaleX || 1),
              height: (fabricObj.height || 0) * (fabricObj.scaleY || 1),
            },
            rotation: fabricObj.angle || 0,
            style: {
              ...element.style,
              fontSize: (fabricObj as any).fontSize || element.style.fontSize,
            },
          });
        });
        
        break;

      case 'image':
        if (element.content) {
          // Get frame position to calculate absolute position
          const frameObjForImage = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
          const frameLeftForImage = frameObjForImage?.left || 0;
          const frameTopForImage = frameObjForImage?.top || 0;
          
          Image.fromURL(element.content).then((img) => {
            img.set({
              left: frameLeftForImage + element.position.x,
              top: frameTopForImage + element.position.y,
              scaleX: element.size.width / (img.width || 1),
              scaleY: element.size.height / (img.height || 1),
              angle: element.rotation,
              selectable: true,
              hasControls: true,
              cornerSize: 10,
              cornerColor: '#8b5cf6',
              cornerStrokeColor: '#ffffff',
              borderColor: '#8b5cf6',
            });
            (img as any).frameId = frameId;
            (img as any).elementId = element.id;
            canvas.add(img);
            
            // Move image to front of frame
            const frameObjForImageAfter = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
            if (frameObjForImageAfter) {
              const frameIndex = canvas.getObjects().indexOf(frameObjForImageAfter);
              canvas.moveObjectTo(img, frameIndex + 1);
            } else {
              // Bring image to front (move to last index)
              const objects = canvas.getObjects();
              canvas.moveObjectTo(img, objects.length - 1);
            }
            
            canvas.renderAll();
          });
          return;
        }
        break;

      case 'shape':
        // Get frame position to calculate absolute position
        const frameObjForShape = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
        const frameLeftForShape = frameObjForShape?.left || 0;
        const frameTopForShape = frameObjForShape?.top || 0;
        
        const shapeType = element.content || 'rect';
        if (shapeType === 'rect') {
          fabricObj = new Rect({
            left: frameLeftForShape + element.position.x,
            top: frameTopForShape + element.position.y,
            width: element.size.width,
            height: element.size.height,
            fill: element.style.fill || '#3b82f6',
            stroke: element.style.stroke || '#1e40af',
            strokeWidth: element.style.strokeWidth || 2,
            angle: element.rotation,
            selectable: true,
            hasControls: true,
            cornerSize: 10,
            cornerColor: '#8b5cf6',
            cornerStrokeColor: '#ffffff',
            borderColor: '#8b5cf6',
          });
        } else if (shapeType === 'circle') {
          fabricObj = new Circle({
            left: frameLeftForShape + element.position.x,
            top: frameTopForShape + element.position.y,
            radius: element.size.width / 2,
            fill: element.style.fill || '#3b82f6',
            stroke: element.style.stroke || '#1e40af',
            strokeWidth: element.style.strokeWidth || 2,
            angle: element.rotation,
            selectable: true,
            hasControls: true,
            cornerSize: 10,
            cornerColor: '#8b5cf6',
            cornerStrokeColor: '#ffffff',
            borderColor: '#8b5cf6',
          });
        }
        break;
    }

    if (fabricObj) {
      (fabricObj as any).frameId = frameId;
      (fabricObj as any).elementId = element.id;

      fabricObj.on('selected', () => {
        selectElement(frameId, element.id);
      });

      fabricObj.on('moving', () => {
        // Get frame position to calculate relative position
        const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
        const frameLeft = frameObj?.left || 0;
        const frameTop = frameObj?.top || 0;
        
        updateElement(frameId, element.id, {
          position: { 
            x: (fabricObj!.left || 0) - frameLeft, 
            y: (fabricObj!.top || 0) - frameTop 
          },
        });
      });

      fabricObj.on('modified', () => {
        // Get frame position to calculate relative position
        const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
        const frameLeft = frameObj?.left || 0;
        const frameTop = frameObj?.top || 0;
        
        updateElement(frameId, element.id, {
          position: { 
            x: (fabricObj!.left || 0) - frameLeft, 
            y: (fabricObj!.top || 0) - frameTop 
          },
          size: {
            width: (fabricObj as any).width || element.size.width,
            height: (fabricObj as any).height || element.size.height,
          },
          rotation: fabricObj!.angle || 0,
        });
      });

      canvas.add(fabricObj);
      
      // Move element to front of frame (but keep frame visible)
      const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === frameId);
      if (frameObj) {
        const frameIndex = canvas.getObjects().indexOf(frameObj);
        canvas.moveObjectTo(fabricObj, frameIndex + 1);
      } else {
        // Bring element to front (move to last index)
        const objects = canvas.getObjects();
        canvas.moveObjectTo(fabricObj, objects.length - 1);
      }
      
      canvas.renderAll();
    }
  }, [canvas, selectElement, updateElement]);

  // Auto-center selected frame when selection originates outside the canvas
  useEffect(() => {
    if (!canvas || !selectedFrameId) return;
    if (selectionMode === 'canvas') return;
    
    const frame = frames.find((f) => f.id === selectedFrameId);
    if (!frame) return;

    const timeoutId = setTimeout(() => {
      const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === selectedFrameId);
      if (frameObj) {
        canvas.setActiveObject(frameObj);
      }

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const centerX = frame.position.x + frame.width / 2;
      const centerY = frame.position.y + frame.height / 2;

      const zoomX = (canvasWidth * 0.75) / frame.width;
      const zoomY = (canvasHeight * 0.75) / frame.height;
      const fitZoom = Math.min(zoomX, zoomY, 3);

      const panX = canvasWidth / 2 - centerX * fitZoom;
      const panY = canvasHeight / 2 - centerY * fitZoom;

      const zoomPoint = new Point(canvasWidth / 2, canvasHeight / 2);
      canvas.zoomToPoint(zoomPoint, fitZoom);

      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] = panX;
        vpt[5] = panY;
        canvas.setViewportTransform(vpt);
      }

      if (frameObj) {
        frameObj.setCoords();
      }

      setZoom(fitZoom);
      setPan(panX, panY);
      canvas.requestRenderAll();

      setSelectionMode('canvas');
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [canvas, selectedFrameId, frames, selectionMode, setPan, setSelectionMode, setZoom]);

  // Render frames on canvas
  useEffect(() => {
    if (!canvas) return;

    // Add or update frames (don't clear all, just update what's needed)
    frames.forEach((frame) => {
      const existingObj = canvas.getObjects().find((obj) => (obj as any).frameId === frame.id);
      if (existingObj) {
        if (!(existingObj as any)._preziHandlersBound) {
          existingObj.on('selected', (e: TEvent) => {
            const { overviewMode } = usePresentationEditorStore.getState();
            
            // In overview mode, clicking a frame navigates to it
            if (overviewMode) {
              goToFrame(frame.id);
              return;
            }
            
            setSelectionMode('canvas');
            const isMultiSelect = e.e && (e.e.shiftKey || e.e.ctrlKey || e.e.metaKey);
            
            
            if (isMultiSelect) {
              const currentIds = usePresentationEditorStore.getState().selectedFrameIds;
              if (!currentIds.includes(frame.id)) {
                usePresentationEditorStore.getState().selectFrames([...currentIds, frame.id]);
              }
            } else {
              selectFrame(frame.id);
            }
            
            const pathIndex = path.indexOf(frame.id);
            existingObj.set({
              stroke: '#3b82f6',
              strokeWidth: 3,
              strokeDashArray: undefined, // Solid border when selected
              shadow: new Shadow({
                color: 'rgba(59, 130, 246, 0.4)',
                blur: 20,
                offsetX: 0,
                offsetY: 8,
              }),
            });
            // Update label color
            const labelObj = canvas.getObjects().find((obj) => 
              (obj as any).isFrameLabel && (obj as any).frameId === frame.id
            );
            if (labelObj) {
              labelObj.set({ fill: '#3b82f6' });
            }
            canvas.renderAll();
          });

          existingObj.on('mousedblclick', () => {
            setSelectionMode('external');
            goToFrame(frame.id);
          });

          existingObj.on('deselected', () => {
            const pathIndex = path.indexOf(frame.id);
            const isInPath = pathIndex >= 0;
            existingObj.set({
              stroke: isInPath ? '#10b981' : (frame.borderColor || '#6b7280'),
              strokeWidth: 2,
              strokeDashArray: [8, 4], // Dashed border for unselected
              shadow: new Shadow({
                color: 'rgba(0, 0, 0, 0.1)',
                blur: 15,
                offsetX: 0,
                offsetY: 6,
              }),
            });
            // Update label color
            const labelObj = canvas.getObjects().find((obj) => 
              (obj as any).isFrameLabel && (obj as any).frameId === frame.id
            );
            if (labelObj) {
              labelObj.set({ fill: isInPath ? '#10b981' : '#6b7280' });
            }
            canvas.renderAll();
          });

          (existingObj as any)._preziHandlersBound = true;
        }

        // Update existing object only if position/size changed
        const isSelected = selectedFrameId === frame.id || selectedFrameIds.includes(frame.id);
        const pathIndex = path.indexOf(frame.id);
        const isInPath = pathIndex >= 0;
        const needsUpdate = 
          existingObj.left !== frame.position.x ||
          existingObj.top !== frame.position.y ||
          existingObj.width !== frame.width ||
          existingObj.height !== frame.height ||
          existingObj.angle !== frame.rotation;
        
        if (needsUpdate) {
          existingObj.set({
            left: frame.position.x,
            top: frame.position.y,
            width: frame.width,
            height: frame.height,
            fill: frame.backgroundColor || '#ffffff',
            stroke: isSelected ? '#3b82f6' : (isInPath ? '#10b981' : (frame.borderColor || '#6b7280')),
            strokeWidth: isSelected ? 3 : 2,
            strokeDashArray: isSelected ? undefined : [8, 4],
            angle: frame.rotation,
            shadow: isSelected ? new Shadow({
              color: 'rgba(59, 130, 246, 0.4)',
              blur: 20,
              offsetX: 0,
              offsetY: 8,
            }) : new Shadow({
              color: 'rgba(0, 0, 0, 0.1)',
              blur: 15,
              offsetX: 0,
              offsetY: 6,
            }),
          });
          existingObj.setCoords();
          
          // Update label position and text
          const existingLabel = canvas.getObjects().find((obj) => 
            (obj as any).isFrameLabel && (obj as any).frameId === frame.id
          ) as Text | undefined;
          const labelText = pathIndex >= 0 
            ? `${pathIndex + 1}. ${frame.title || `Slide ${pathIndex + 1}`}`
            : frame.title || `Frame ${frames.indexOf(frame) + 1}`;
          
          if (existingLabel) {
            existingLabel.set({
              text: labelText,
              left: frame.position.x + 16,
              top: frame.position.y + 16,
              fill: isSelected ? '#3b82f6' : (isInPath ? '#10b981' : '#6b7280'),
            });
            existingLabel.setCoords();
          }
          
        } else {
          // Just update visual state
          const isSelectedNow = selectedFrameId === frame.id || selectedFrameIds.includes(frame.id);
          existingObj.set({
            fill: frame.backgroundColor || '#ffffff',
            stroke: isSelectedNow ? '#3b82f6' : (isInPath ? '#10b981' : (frame.borderColor || '#6b7280')),
            strokeWidth: isSelectedNow ? 3 : 2,
            strokeDashArray: isSelectedNow ? undefined : [8, 4],
            shadow: isSelectedNow ? new Shadow({
              color: 'rgba(59, 130, 246, 0.4)',
              blur: 20,
              offsetX: 0,
              offsetY: 8,
            }) : new Shadow({
              color: 'rgba(0, 0, 0, 0.1)',
              blur: 15,
              offsetX: 0,
              offsetY: 6,
            }),
          });
          
          // Update label text and color
          const existingLabel = canvas.getObjects().find((obj) => 
            (obj as any).isFrameLabel && (obj as any).frameId === frame.id
          ) as Text | undefined;
          const labelText = pathIndex >= 0 
            ? `${pathIndex + 1}. ${frame.title || `Slide ${pathIndex + 1}`}`
            : frame.title || `Frame ${frames.indexOf(frame) + 1}`;
          
          if (existingLabel) {
            existingLabel.set({
              text: labelText,
              fill: isSelectedNow ? '#3b82f6' : (isInPath ? '#10b981' : '#6b7280'),
            });
          }
          
        }
      } else {
        // Create new frame object
        const isSelected = selectedFrameId === frame.id || selectedFrameIds.includes(frame.id);
        const pathIndex = path.indexOf(frame.id);
        const isInPath = pathIndex >= 0;
        
        const rect = new Rect({
          left: frame.position.x,
          top: frame.position.y,
          width: frame.width,
          height: frame.height,
          fill: frame.backgroundColor || '#ffffff',
          stroke: isSelected ? '#3b82f6' : (isInPath ? '#10b981' : (frame.borderColor || '#6b7280')),
          strokeWidth: isSelected ? 3 : 2,
          strokeDashArray: isSelected ? undefined : [8, 4], // Dashed border for unselected frames
          rx: 12,
          ry: 12,
          selectable: tool === 'select' && !frame.locked,
          evented: tool === 'select' && !frame.locked,
          hasControls: tool === 'select' && !frame.locked,
          hasBorders: tool === 'select' && !frame.locked,
          lockRotation: frame.locked || false,
          lockScalingX: frame.locked || false,
          lockScalingY: frame.locked || false,
          lockMovementX: frame.locked || false,
          lockMovementY: frame.locked || false,
          cornerSize: 12,
          cornerColor: '#3b82f6',
          cornerStrokeColor: '#ffffff',
          transparentCorners: false,
          borderColor: isSelected ? '#3b82f6' : (isInPath ? '#10b981' : '#6b7280'),
          borderScaleFactor: 2,
          angle: frame.rotation,
          shadow: isSelected ? new Shadow({
            color: 'rgba(59, 130, 246, 0.4)',
            blur: 20,
            offsetX: 0,
            offsetY: 8,
          }) : new Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 15,
            offsetX: 0,
            offsetY: 6,
          }),
        });

        (rect as any).frameId = frame.id;

        // Handle selection
        rect.on('selected', (e: TEvent) => {
          const { overviewMode } = usePresentationEditorStore.getState();
          
          // In overview mode, clicking a frame navigates to it
          if (overviewMode) {
            goToFrame(frame.id);
            return;
          }
          
          setSelectionMode('canvas');
          const isMultiSelect = e.e && (e.e.shiftKey || e.e.ctrlKey || e.e.metaKey);
          
          
          if (isMultiSelect) {
            const currentIds = usePresentationEditorStore.getState().selectedFrameIds;
            if (!currentIds.includes(frame.id)) {
              usePresentationEditorStore.getState().selectFrames([...currentIds, frame.id]);
            }
          } else {
            selectFrame(frame.id);
          }
          
          const pathIndex = path.indexOf(frame.id);
          rect.set({
            stroke: '#3b82f6',
            strokeWidth: 3,
            strokeDashArray: undefined, // Solid border when selected
            shadow: new Shadow({
              color: 'rgba(59, 130, 246, 0.4)',
              blur: 20,
              offsetX: 0,
              offsetY: 8,
            }),
          });
          canvas.renderAll();
        });

        rect.on('mousedblclick', () => {
          setSelectionMode('external');
          goToFrame(frame.id);
        });

        rect.on('deselected', () => {
          const pathIndex = path.indexOf(frame.id);
          const isInPath = pathIndex >= 0;
          rect.set({
            stroke: isInPath ? '#10b981' : (frame.borderColor || '#6b7280'),
            strokeWidth: 2,
            strokeDashArray: [8, 4], // Dashed border for unselected
            shadow: new Shadow({
              color: 'rgba(0, 0, 0, 0.1)',
              blur: 15,
              offsetX: 0,
              offsetY: 6,
            }),
          });
          canvas.renderAll();
        });

        // Handle moving (dragging) - update in real-time with snap-to-grid
        const GRID_SIZE_MOVE = 40; // Larger grid for better alignment
        const snapToGridMove = (value: number) => Math.round(value / GRID_SIZE_MOVE) * GRID_SIZE_MOVE;
        
        rect.on('moving', () => {
          // Prevent moving if frame is locked
          if (frame.locked) {
            rect.set({ left: frame.position.x, top: frame.position.y });
            return;
          }
          const snappedX = snapToGridMove(rect.left || 0);
          const snappedY = snapToGridMove(rect.top || 0);
          rect.set({ left: snappedX, top: snappedY });
          const newPos = { x: snappedX, y: snappedY };
          updateFrame(frame.id, {
            position: newPos,
          });
          
          // Update frame label position
          const labelObj = canvas.getObjects().find((obj) => 
            (obj as any).isFrameLabel && (obj as any).frameId === frame.id
          );
          if (labelObj) {
            labelObj.set({
              left: newPos.x + 12,
              top: newPos.y + 12,
            });
            labelObj.setCoords();
          }
          
          // Update all elements within this frame to move with it
          const frameElements = canvas.getObjects().filter((obj) => 
            (obj as any).elementId && (obj as any).frameId === frame.id
          );
          frameElements.forEach((elementObj) => {
            const element = frame.elements.find((el) => el.id === (elementObj as any).elementId);
            if (element) {
              elementObj.set({
                left: newPos.x + element.position.x,
                top: newPos.y + element.position.y,
              });
              elementObj.setCoords();
            }
          });
        });

        // Handle modification (resize/rotate)
        rect.on('modified', () => {
          // Prevent modification if frame is locked
          if (frame.locked) {
            rect.set({
              left: frame.position.x,
              top: frame.position.y,
              width: frame.width,
              height: frame.height,
              angle: frame.rotation,
            });
            return;
          }
          const newPos = { x: rect.left || 0, y: rect.top || 0 };
          const newWidth = rect.width || frame.width;
          const newHeight = rect.height || frame.height;
          updateFrame(frame.id, {
            position: newPos,
            width: newWidth,
            height: newHeight,
            rotation: rect.angle || 0,
          });
          
          // Update frame label position
          const labelObj = canvas.getObjects().find((obj) => 
            (obj as any).isFrameLabel && (obj as any).frameId === frame.id
          );
          if (labelObj) {
            labelObj.set({
              left: newPos.x + 12,
              top: newPos.y + 12,
            });
            labelObj.setCoords();
          }
          
        });

        // Handle scaling
        rect.on('scaling', () => {
          // Prevent scaling if frame is locked
          if (frame.locked) {
            rect.set({
              scaleX: 1,
              scaleY: 1,
            });
            return;
          }
          updateFrame(frame.id, {
            width: (rect.width || frame.width) * (rect.scaleX || 1),
            height: (rect.height || frame.height) * (rect.scaleY || 1),
          });
        });

        canvas.add(rect);
        
        // Add or update frame label (name/number) on top of frame
        // Note: pathIndex and isInPath are already defined above
        const existingLabel = canvas.getObjects().find((obj) => 
          (obj as any).isFrameLabel && (obj as any).frameId === frame.id
        ) as Text | undefined;
        
        const labelText = pathIndex >= 0 
          ? `${pathIndex + 1}. ${frame.title || `Slide ${pathIndex + 1}`}`
          : frame.title || `Frame ${frames.indexOf(frame) + 1}`;
        
        if (existingLabel) {
          existingLabel.set({
            text: labelText,
            left: frame.position.x + 16,
            top: frame.position.y + 16,
            fill: isSelected ? '#3b82f6' : (isInPath ? '#10b981' : '#6b7280'),
          });
        } else {
          const frameLabel = new Text(labelText, {
            left: frame.position.x + 16,
            top: frame.position.y + 16,
            fontSize: 14,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '600',
            fill: isSelected ? '#3b82f6' : (isInPath ? '#10b981' : '#6b7280'),
            shadow: new Shadow({
              color: 'rgba(0, 0, 0, 0.3)',
              blur: 4,
              offsetX: 0,
              offsetY: 1,
            }),
            selectable: false,
            evented: false,
            excludeFromExport: false,
            originX: 'left',
            originY: 'top',
          });
          (frameLabel as any).frameId = frame.id;
          (frameLabel as any).isFrameLabel = true;
          canvas.add(frameLabel);
        }
        
        // Ensure proper z-ordering: label < frame < elements
        // Labels are non-interactive so they can be at the back
        const labelObj = canvas.getObjects().find((obj) => 
          (obj as any).isFrameLabel && (obj as any).frameId === frame.id
        );
        if (labelObj) {
          // Move label to the back (index 0)
          canvas.moveObjectTo(labelObj, 0);
        }
        
        // Move frame rect to be above label but below elements
        if (rect) {
          const labelIndex = labelObj ? canvas.getObjects().indexOf(labelObj) : 0;
          canvas.moveObjectTo(rect, labelIndex + 1);
        }
        
        // Ensure all elements in this frame are above the frame rect
        const frameElements = canvas.getObjects().filter((obj) => 
          (obj as any).elementId && (obj as any).frameId === frame.id
        );
        frameElements.forEach((elementObj) => {
          const rectIndex = canvas.getObjects().indexOf(rect);
          if (rectIndex >= 0) {
            canvas.moveObjectTo(elementObj, rectIndex + 1);
          }
        });
        
        // Select if it's the selected frame
        if (selectedFrameId === frame.id) {
          canvas.setActiveObject(rect);
        }
      }

      // Add elements within frame - ensure they're created after frame
      const frameObj = canvas.getObjects().find((obj) => (obj as any).frameId === frame.id);
      if (frameObj) {
        frame.elements.forEach((element) => {
          const existingElement = canvas.getObjects().find((obj) => (obj as any).elementId === element.id);
          
          if (!existingElement) {
            // Create element with proper positioning relative to frame
            createElementObject(frame.id, element);
          } else {
            // Update existing element position relative to frame
            const expectedLeft = (frameObj.left || 0) + element.position.x;
            const expectedTop = (frameObj.top || 0) + element.position.y;
            
            if (Math.abs((existingElement.left || 0) - expectedLeft) > 1 || 
                Math.abs((existingElement.top || 0) - expectedTop) > 1) {
              existingElement.set({
                left: expectedLeft,
                top: expectedTop,
              });
              existingElement.setCoords();
            }
            
            // Ensure text elements have double-click editing if they don't already
            if (element.type === 'text' && existingElement.type === 'i-text') {
              const hasDblClickHandler = (existingElement as any)._preziTextHandlersBound;
              if (!hasDblClickHandler) {
                existingElement.on('mousedblclick', () => {
                  if (canvas && existingElement && (existingElement as any).enterEditing) {
                    canvas.setActiveObject(existingElement);
                    (existingElement as any).enterEditing();
                    canvas.renderAll();
                  }
                });
                existingElement.on('editing:exited', () => {
                  const textObj = existingElement as any;
                  const newText = textObj.text || '';
                  updateElement(frame.id, element.id, {
                    content: newText,
                  });
                  canvas.renderAll();
                });
                (existingElement as any)._preziTextHandlersBound = true;
              }
            }
            
            // Ensure element is visible and on top of frame
            const objects = canvas.getObjects();
            const elementIndex = objects.indexOf(existingElement);
            const frameIndex = objects.indexOf(frameObj);
            if (elementIndex <= frameIndex) {
              canvas.moveObjectTo(existingElement, frameIndex + 1);
            }
          }
        });
      }
    });

    // Remove frames that no longer exist
    const frameIds = new Set(frames.map(f => f.id));
    const objectsToRemove = canvas.getObjects().filter((obj) => {
      const frameId = (obj as any).frameId;
      const isPathLine = (obj as any).isPathLine;
      const isPathBadge = (obj as any).isPathBadge;
      const isPathBadgeLabel = (obj as any).isPathBadgeLabel;
      const isFrameLabel = (obj as any).isFrameLabel;
      // Remove frame-related objects if frame doesn't exist, but keep labels if frame exists
      return (frameId && !frameIds.has(frameId) && !isFrameLabel) || isPathLine || isPathBadge || isPathBadgeLabel;
    });
    objectsToRemove.forEach((obj) => canvas.remove(obj));

          // Draw path connections - cleaner styling
    if (path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        const frame1 = frames.find((f) => f.id === path[i]);
        const frame2 = frames.find((f) => f.id === path[i + 1]);
        if (frame1 && frame2) {
          const x1 = frame1.position.x + frame1.width / 2;
          const y1 = frame1.position.y + frame1.height / 2;
          const x2 = frame2.position.x + frame2.width / 2;
          const y2 = frame2.position.y + frame2.height / 2;

          const line = new Line([x1, y1, x2, y2], {
            stroke: 'rgba(59, 130, 246, 0.3)',
            strokeWidth: 1.5,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
            excludeFromExport: true,
          });
          (line as any).isPathLine = true;
          canvas.add(line);
          // Send path lines to back so frames appear on top
          const objects = canvas.getObjects();
          const lineIndex = objects.indexOf(line);
          if (lineIndex > 0) {
            canvas.moveObjectTo(line, 0);
          }
        }
      }
    }
    
    if (path.length > 0) {
      path.forEach((frameId, index) => {
        const frame = frames.find((f) => f.id === frameId);
        if (!frame) return;

        const badgeRadius = 14;
        const badgeCenterX = frame.position.x - badgeRadius * 1.4;
        const badgeCenterY = frame.position.y - badgeRadius * 1.4;

        const isCurrent = frame.id === selectedFrameId;
        const badgeCircle = new Circle({
          left: badgeCenterX,
          top: badgeCenterY,
          radius: badgeRadius,
          fill: isCurrent ? '#f97316' : index === 0 ? '#10b981' : 'rgba(59, 130, 246, 0.85)',
          stroke: '#ffffff',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
          excludeFromExport: true,
        });
        (badgeCircle as any).isPathBadge = true;
        canvas.add(badgeCircle);
        canvas.moveObjectTo(badgeCircle, canvas.getObjects().length - 1);

        const badgeLabel = new Text(String(index + 1), {
          left: badgeCenterX,
          top: badgeCenterY,
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#ffffff',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        (badgeLabel as any).isPathBadgeLabel = true;
        canvas.add(badgeLabel);
        canvas.moveObjectTo(badgeLabel, canvas.getObjects().length - 1);
      });
    }

    canvas.renderAll();
  }, [canvas, frames, selectedFrameId, selectedFrameIds, selectFrame, updateFrame, createElementObject, tool, path]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;
    canvas.selection = tool === 'select';
    canvas.defaultCursor = tool === 'frame' ? 'crosshair' : 'default';
    canvas.hoverCursor = tool === 'select' ? 'move' : (tool === 'frame' ? 'crosshair' : 'default');
    canvas.moveCursor = 'move';
    
    // Update all objects to be selectable only in select mode
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).frameId || (obj as any).elementId) {
        obj.selectable = tool === 'select';
        obj.evented = tool === 'select';
      }
    });
    canvas.renderAll();
  }, [canvas, tool]);

  // Overview mode is now handled by OverviewWindow component
  // No need to auto-fit canvas here

  // Handle text tool
  useEffect(() => {
    if (!canvas || tool !== 'text') return;

    const handleMouseDown = (e: TEvent) => {
      if (!selectedFrameId) return;

      const frameObj = canvas
        .getObjects()
        .find((obj) => (obj as any).frameId === selectedFrameId) as Rect | undefined;

      if (!frameObj) return;

      const pointer = canvas.getPointer(e.e);
      const frameLeft = frameObj.left || 0;
      const frameTop = frameObj.top || 0;

      const relativeX = Math.max(16, Math.min((pointer.x - frameLeft), (frameObj.width || 0) - 16));
      const relativeY = Math.max(16, Math.min((pointer.y - frameTop), (frameObj.height || 0) - 16));

      const elementId = addElement(selectedFrameId, {
        type: 'text',
        content: 'Double-click to edit',
        position: { x: relativeX, y: relativeY },
          size: { width: 200, height: 50 },
          rotation: 0,
          style: {
            fontSize: 24,
            fontFamily: 'Arial',
            fill: '#000000',
          },
        });

      const frame = frames.find((f) => f.id === selectedFrameId);
      if (frame) {
        const element = frame.elements.find((el) => el.id === elementId);
        if (element) {
          createElementObject(selectedFrameId, element);
        }
      }

      selectElement(selectedFrameId, elementId);
      setTool('select');
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas, tool, selectedFrameId, frames, addElement, createElementObject, selectElement, setTool]);

  // Handle image tool
  useEffect(() => {
    if (!canvas || tool !== 'image') return;

    const handleMouseDown = (e: TEvent) => {
      if (!selectedFrameId) return;

      const target = canvas.findTarget(e.e);
      if (target) return;

      const pointer = canvas.getPointer(e.e);
      const frameObj = canvas
        .getObjects()
        .find((obj) => (obj as any).frameId === selectedFrameId) as Rect | undefined;

      if (!frameObj) return;

      const frameLeft = frameObj.left || 0;
      const frameTop = frameObj.top || 0;
      const relativeX = Math.max(16, Math.min((pointer.x - frameLeft), (frameObj.width || 0) - 16));
      const relativeY = Math.max(16, Math.min((pointer.y - frameTop), (frameObj.height || 0) - 16));

      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          setTool('select');
          return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const imageUrl = readerEvent.target?.result as string;
          if (!imageUrl) return;

          const elementId = addElement(selectedFrameId, {
            type: 'image',
            content: imageUrl,
            position: { x: relativeX, y: relativeY },
            size: { width: 200, height: 200 },
            rotation: 0,
            style: {},
          });

          const frame = frames.find((f) => f.id === selectedFrameId);
          if (frame) {
            const element = frame.elements.find((el) => el.id === elementId);
            if (element) {
              createElementObject(selectedFrameId, element);
            }
          }

          selectElement(selectedFrameId, elementId);
          setTool('select');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas, tool, selectedFrameId, frames, addElement, createElementObject, selectElement, setTool]);

  // Handle clicking on empty canvas to deselect
  useEffect(() => {
    if (!canvas || tool !== 'select') return;

    const handleMouseDown = (e: TEvent) => {
      if (!e.e) return;
      const target = canvas.findTarget(e.e);
      if (!target || (!(target as any).frameId && !(target as any).elementId)) {
        // Clicked on empty canvas
        if (!e.e.shiftKey && !e.e.ctrlKey && !e.e.metaKey) {
          selectFrame(null);
          selectElement(null, null);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas, tool, selectFrame, selectElement]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden"
      style={{ 
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full"
        />
      </div>
      
      {/* Helpful tooltips */}
      {tool === 'select' && (
        <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-md border border-gray-800/60 rounded-xl px-4 py-2.5 text-xs text-gray-200 shadow-xl z-10 max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></div>
            <span className="leading-relaxed">Click and drag frames to move • Use corner handles to resize • Rotate with top handle</span>
          </div>
        </div>
      )}
      {tool === 'frame' && (
        <div className="absolute top-4 left-4 bg-blue-900/95 backdrop-blur-md border border-blue-700/60 rounded-xl px-4 py-3 text-xs text-blue-50 shadow-xl z-10 max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0 mt-1"></div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-blue-100">Create Slide</span>
              <span className="text-blue-200/90 leading-relaxed">Click and drag on canvas • Hold Shift for 16:9 aspect ratio • Snaps to 20px grid</span>
            </div>
          </div>
        </div>
      )}

      {tool === 'text' && selectedFrameId && (
        <div className="absolute top-4 left-4 bg-purple-600/95 backdrop-blur-md border border-purple-500/60 rounded-xl px-4 py-2.5 text-xs text-white shadow-xl z-10 max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0"></div>
            <span className="leading-relaxed">Click on canvas to add text to the selected frame</span>
          </div>
        </div>
      )}

      {tool === 'text' && !selectedFrameId && (
        <div className="absolute top-4 left-4 bg-amber-600/95 backdrop-blur-md border border-amber-500/60 rounded-xl px-4 py-2.5 text-xs text-white shadow-xl z-10 max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0"></div>
            <span className="leading-relaxed">Select a frame first to add text</span>
          </div>
        </div>
      )}

      {/* Frame count indicator */}
      {frames.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-md border border-gray-800/60 rounded-xl px-4 py-2.5 text-xs text-gray-200 shadow-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="font-medium">{frames.length} {frames.length === 1 ? 'slide' : 'slides'}</span>
            {path.length > 0 && (
              <>
                <div className="w-px h-3 bg-gray-700/60 mx-0.5"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span className="text-gray-300">{path.length} in path</span>
              </>
            )}
          </div>
        </div>
      )}


      {/* Mini-map */}
      <CanvasMinimap />
    </div>
  );
}

