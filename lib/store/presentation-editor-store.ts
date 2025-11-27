"use client";

import { create } from 'zustand';
import type { Canvas, Object as FabricObject, Group, Point } from 'fabric';

export interface PresentationElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'video' | 'chart' | 'table';
  content: string | null; // Text content, image URL, video URL, shape type, chart data, or table data
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    opacity?: number;
    [key: string]: any;
  };
  fabricObject?: FabricObject; // Reference to Fabric.js object
}

export interface PresentationFrame {
  id: string;
  title?: string; // Slide title
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
  elements: PresentationElement[];
  fabricGroup?: Group; // Reference to Fabric.js group
  locked?: boolean; // Lock frame from editing
  notes?: string; // Presenter notes
  tags?: string[]; // Tags for organization
}

export type HistoryState = {
  frames: PresentationFrame[];
  path: string[];
};

export interface PresentationState {
  // Canvas state
  canvas: Canvas | null;
  zoom: number;
  panX: number;
  panY: number;
  selectionMode: 'canvas' | 'external';
  
  // Frames
  frames: PresentationFrame[];
  selectedFrameId: string | null;
  selectedFrameIds: string[]; // Multi-select
  
  // Elements
  selectedElementId: string | null;
  selectedElementIds: string[]; // Multi-select
  
  // Path (navigation order)
  path: string[]; // Array of frame IDs
  
  // Editor state
  isPresenting: boolean;
  currentFrameId: string | null;
  tool: 'select' | 'frame' | 'text' | 'image' | 'shape' | 'video';
  overviewMode: boolean; // Prezi-like overview mode
  
  // Undo/Redo
  history: HistoryState[];
  historyIndex: number;
  clipboard: {
    frames?: PresentationFrame[];
    elements?: { frameId: string; element: PresentationElement }[];
  } | null;
  
  // Actions
  setCanvas: (canvas: Canvas | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  addFrame: (frame: Omit<PresentationFrame, 'id' | 'elements'>, id?: string) => string;
  updateFrame: (id: string, updates: Partial<PresentationFrame>) => void;
  deleteFrame: (id: string) => void;
  reorderFrame: (fromIndex: number, toIndex: number) => void;
  duplicateFrame: (id: string) => string;
  selectFrame: (id: string | null) => void;
  selectFrames: (ids: string[]) => void;
  addElement: (frameId: string, element: Omit<PresentationElement, 'id'>) => string;
  updateElement: (frameId: string, elementId: string, updates: Partial<PresentationElement>) => void;
  deleteElement: (frameId: string, elementId: string) => void;
  duplicateElement: (frameId: string, elementId: string) => string;
  selectElement: (frameId: string | null, elementId: string | null) => void;
  selectElements: (frameId: string, elementIds: string[]) => void;
  setPath: (path: string[]) => void;
  setTool: (tool: PresentationState['tool']) => void;
  setSelectionMode: (mode: 'canvas' | 'external') => void;
  setCurrentFrame: (frameId: string | null) => void;
  setIsPresenting: (isPresenting: boolean) => void;
  fitCanvasToFrames: () => void;
  zoomToFrame: (frameId: string, smooth?: boolean) => void;
  zoomToPoint: (point: Point, zoom: number) => void;
  zoomToSelection: () => void;
  
  // Undo/Redo
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Copy/Paste
  copyFrames: (frameIds: string[]) => void;
  copyElements: (frameId: string, elementIds: string[]) => void;
  paste: (offset?: { x: number; y: number }) => void;
  cutFrames: (frameIds: string[]) => void;
  cutElements: (frameId: string, elementIds: string[]) => void;
  
  // Align/Distribute
  alignFrames: (frameIds: string[], alignment: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle') => void;
  distributeFrames: (frameIds: string[], direction: 'horizontal' | 'vertical') => void;
  alignElements: (frameId: string, elementIds: string[], alignment: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle') => void;
  distributeElements: (frameId: string, elementIds: string[], direction: 'horizontal' | 'vertical') => void;
  
  // Group/Ungroup
  groupElements: (frameId: string, elementIds: string[]) => string | null;
  ungroupElement: (frameId: string, elementId: string) => void;
  
  // Lock/Unlock
  lockElement: (frameId: string, elementId: string) => void;
  unlockElement: (frameId: string, elementId: string) => void;
  lockElements: (frameId: string, elementIds: string[]) => void;
  unlockElements: (frameId: string, elementIds: string[]) => void;
  
  // Navigation
  goToNextFrame: () => void;
  goToPreviousFrame: () => void;
  goToFrame: (frameId: string) => void;
  
  // Prezi-like features
  setOverviewMode: (enabled: boolean) => void;
  toggleOverviewMode: () => void;
  
  // Frame management
  lockFrame: (id: string) => void;
  unlockFrame: (id: string) => void;
  lockFrames: (ids: string[]) => void;
  unlockFrames: (ids: string[]) => void;
  duplicateFrames: (ids: string[]) => void;
  
  // Export
  exportCanvas: (format: 'png' | 'jpg' | 'svg') => Promise<string | null>;
}

const generateId = () => `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateElementId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const usePresentationEditorStore = create<PresentationState>((set, get) => ({
  // Initial state
  canvas: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  selectionMode: 'external',
  frames: [],
  selectedFrameId: null,
  selectedFrameIds: [],
  selectedElementId: null,
  selectedElementIds: [],
  path: [],
  isPresenting: false,
  currentFrameId: null,
  tool: 'select',
  overviewMode: false,
  history: [],
  historyIndex: -1,
  clipboard: null,
  
  // Canvas actions
  setCanvas: (canvas) => set({ canvas }),
  
  setZoom: (zoom) => {
    const { canvas } = get();
    if (canvas) {
      canvas.setZoom(zoom);
    }
    set({ zoom });
  },
  
  setPan: (panX, panY) => {
    const { canvas } = get();
    if (canvas) {
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] = panX;
        vpt[5] = panY;
        canvas.setViewportTransform(vpt);
      }
    }
    set({ panX, panY });
  },
  
  // Frame actions
  addFrame: (frameData, providedId) => {
    const id = providedId || generateId();
    const frame: PresentationFrame = {
      id,
      ...frameData,
      elements: [],
    };
    set((state) => {
      // Don't add to path if providedId is given (we're loading, path will be set separately)
      const newState = {
        frames: [...state.frames, frame],
        path: providedId ? state.path : [...state.path, id],
      };
      if (!providedId) {
        // Save history only for user actions, not loading
        setTimeout(() => get().saveHistory(), 0);
      }
      return newState;
    });
    return id;
  },
  
  updateFrame: (id, updates) => {
    set((state) => ({
      frames: state.frames.map((frame) =>
        frame.id === id ? { ...frame, ...updates } : frame
      ),
    }));
    setTimeout(() => get().saveHistory(), 0);
  },
  
  deleteFrame: (id) => {
    set((state) => ({
      frames: state.frames.filter((frame) => frame.id !== id),
      path: state.path.filter((frameId) => frameId !== id),
      selectedFrameId: state.selectedFrameId === id ? null : state.selectedFrameId,
      selectedFrameIds: state.selectedFrameIds.filter((fid) => fid !== id),
      currentFrameId: state.currentFrameId === id ? null : state.currentFrameId,
    }));
    setTimeout(() => get().saveHistory(), 0);
  },
  
  reorderFrame: (fromIndex, toIndex) => {
    const { frames } = get();
    if (fromIndex < 0 || fromIndex >= frames.length || toIndex < 0 || toIndex >= frames.length) return;
    
    const newFrames = [...frames];
    const [movedFrame] = newFrames.splice(fromIndex, 1);
    newFrames.splice(toIndex, 0, movedFrame);
    
    set({ frames: newFrames });
    setTimeout(() => get().saveHistory(), 0);
  },
  
  duplicateFrame: (id) => {
    const { frames } = get();
    const frame = frames.find((f) => f.id === id);
    if (!frame) return '';
    
    const newId = generateId();
    const duplicatedFrame: PresentationFrame = {
      ...frame,
      id: newId,
      position: { x: frame.position.x + 50, y: frame.position.y + 50 },
      title: frame.title ? `${frame.title} (Copy)` : undefined,
      elements: frame.elements.map((el) => ({
        ...el,
        id: generateElementId(),
        position: { x: el.position.x + 20, y: el.position.y + 20 },
      })),
    };
    
    set((state) => ({
      frames: [...state.frames, duplicatedFrame],
      path: [...state.path, newId],
      selectedFrameId: newId,
    }));
    setTimeout(() => get().saveHistory(), 0);
    return newId;
  },
  
  selectFrame: (id) => set({ selectedFrameId: id, selectedElementId: null, selectedFrameIds: id ? [id] : [] }),
  
  selectFrames: (ids) => set({ selectedFrameIds: ids, selectedFrameId: ids.length === 1 ? ids[0] : null }),
  
  // Element actions
  addElement: (frameId, elementData) => {
    const elementId = generateElementId();
    const element: PresentationElement = {
      id: elementId,
      ...elementData,
    };
    
    set((state) => ({
      frames: state.frames.map((frame) =>
        frame.id === frameId
          ? { ...frame, elements: [...frame.elements, element] }
          : frame
      ),
    }));
    setTimeout(() => get().saveHistory(), 0);
    return elementId;
  },
  
  updateElement: (frameId, elementId, updates) => {
    set((state) => ({
      frames: state.frames.map((frame) =>
        frame.id === frameId
          ? {
              ...frame,
              elements: frame.elements.map((element) =>
                element.id === elementId ? { ...element, ...updates } : element
              ),
            }
          : frame
      ),
    }));
    setTimeout(() => get().saveHistory(), 0);
  },
  
  deleteElement: (frameId, elementId) => {
    set((state) => ({
      frames: state.frames.map((frame) =>
        frame.id === frameId
          ? {
              ...frame,
              elements: frame.elements.filter((element) => element.id !== elementId),
            }
          : frame
      ),
      selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
      selectedElementIds: state.selectedElementIds.filter((eid) => eid !== elementId),
    }));
    setTimeout(() => get().saveHistory(), 0);
  },
  
  duplicateElement: (frameId, elementId) => {
    const { frames } = get();
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return '';
    
    const element = frame.elements.find((el) => el.id === elementId);
    if (!element) return '';
    
    const newElementId = generateElementId();
    const duplicatedElement: PresentationElement = {
      ...element,
      id: newElementId,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
    };
    
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? { ...f, elements: [...f.elements, duplicatedElement] }
          : f
      ),
      selectedElementId: newElementId,
    }));
    setTimeout(() => get().saveHistory(), 0);
    return newElementId;
  },
  
  selectElement: (frameId, elementId) => {
    set({
      selectedFrameId: frameId,
      selectedElementId: elementId,
      selectedElementIds: elementId ? [elementId] : [],
    });
  },
  
  selectElements: (frameId, elementIds) => {
    set({
      selectedFrameId: frameId,
      selectedElementIds: elementIds,
      selectedElementId: elementIds.length === 1 ? elementIds[0] : null,
    });
  },
  
  // Path actions
  setPath: (path) => set({ path }),
  
  // Tool actions
  setTool: (tool) => set({ tool }),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  
  // Presentation actions
  setCurrentFrame: (frameId) => set({ currentFrameId: frameId }),
  
  setIsPresenting: (isPresenting) => set({ isPresenting }),

  fitCanvasToFrames: () => {
    const { canvas, frames } = get();
    if (!canvas || frames.length === 0) return;

    const allX = frames.map((f) => [f.position.x, f.position.x + f.width]).flat();
    const allY = frames.map((f) => [f.position.y, f.position.y + f.height]).flat();
    const minX = Math.min(...allX) - 120;
    const maxX = Math.max(...allX) + 120;
    const minY = Math.min(...allY) - 120;
    const maxY = Math.max(...allY) + 120;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const zoomX = (canvasWidth * 0.9) / contentWidth;
    const zoomY = (canvasHeight * 0.9) / contentHeight;
    const fitZoom = Math.min(zoomX, zoomY, 2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const panX = canvasWidth / 2 - centerX * fitZoom;
    const panY = canvasHeight / 2 - centerY * fitZoom;

    canvas.discardActiveObject();
    
    // Smooth animation to overview
    const currentZoom = get().zoom;
    const currentPanX = get().panX;
    const currentPanY = get().panY;
    const steps = 30;
    let step = 0;
    
    const animate = () => {
      step++;
      const progress = step / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      const zoom = currentZoom + (fitZoom - currentZoom) * easeProgress;
      const panXVal = currentPanX + (panX - currentPanX) * easeProgress;
      const panYVal = currentPanY + (panY - currentPanY) * easeProgress;
      
      canvas.setZoom(zoom);
      canvas.setViewportTransform([zoom, 0, 0, zoom, panXVal, panYVal]);
      set({ zoom, panX: panXVal, panY: panYVal });
      
      if (step < steps) {
        requestAnimationFrame(animate);
      } else {
        set({ selectionMode: 'canvas', currentFrameId: null, selectedFrameId: null });
        canvas.requestRenderAll();
      }
    };
    
    animate();
  },
  
  zoomToFrame: (frameId, smooth = true) => {
    const { canvas, frames } = get();
    if (!canvas) return;
    
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;
    
    // Get actual viewport dimensions (like presentation view does)
    const canvasElement = canvas.getElement();
    const viewportWidth = canvasElement?.clientWidth || canvas.getWidth();
    const viewportHeight = canvasElement?.clientHeight || canvas.getHeight();
    
    // Calculate zoom to fill viewport with padding (matching presentation view behavior)
    const padding = 60; // Similar to presentation view padding
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;
    
    const zoomX = availableWidth / frame.width;
    const zoomY = availableHeight / frame.height;
    // Use smaller zoom to fit entirely, allow up to 4x like presentation view
    const targetZoom = Math.min(Math.min(zoomX, zoomY), 4);
    
    // Center the frame in the viewport (matching presentation view)
    const frameCenterX = frame.position.x + frame.width / 2;
    const frameCenterY = frame.position.y + frame.height / 2;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    
    // Calculate pan to center the frame
    const panX = viewportCenterX - (frameCenterX * targetZoom);
    const panY = viewportCenterY - (frameCenterY * targetZoom);
    
    if (smooth) {
        // Smooth Prezi-like animation with better easing
        const currentZoom = get().zoom;
        const currentPanX = get().panX;
        const currentPanY = get().panY;
        const startTime = performance.now();
        const duration = 800; // 800ms for smooth Prezi-like transitions
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Use easeOutCubic for Prezi-like smooth motion
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          const zoom = currentZoom + (targetZoom - currentZoom) * easeProgress;
          const panXVal = currentPanX + (panX - currentPanX) * easeProgress;
          const panYVal = currentPanY + (panY - currentPanY) * easeProgress;
          
          canvas.setZoom(zoom);
          canvas.setViewportTransform([zoom, 0, 0, zoom, panXVal, panYVal]);
          set({ zoom, panX: panXVal, panY: panYVal });
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Ensure final values
            canvas.setZoom(targetZoom);
            canvas.setViewportTransform([targetZoom, 0, 0, targetZoom, panX, panY]);
            set({ zoom: targetZoom, panX, panY });
            canvas.requestRenderAll();
          }
        };
        
        requestAnimationFrame(animate);
      } else {
      canvas.setZoom(targetZoom);
      canvas.setViewportTransform([targetZoom, 0, 0, targetZoom, panX, panY]);
      set({ zoom: targetZoom, panX, panY });
      canvas.requestRenderAll();
    }
  },
  
  zoomToPoint: (point, zoom) => {
    const { canvas } = get();
    if (!canvas) return;
    
    canvas.zoomToPoint(point, zoom);
    set({ zoom });
    canvas.requestRenderAll();
  },
  
  zoomToSelection: () => {
    const { canvas, selectedFrameId, selectedElementId, selectedFrameIds, frames } = get();
    if (!canvas) return;
    
    if (selectedFrameIds.length > 0) {
      // Multi-select: fit all selected frames
      const selectedFrames = frames.filter((f) => selectedFrameIds.includes(f.id));
      if (selectedFrames.length === 0) return;
      
      const allX = selectedFrames.map((f) => [f.position.x, f.position.x + f.width]).flat();
      const allY = selectedFrames.map((f) => [f.position.y, f.position.y + f.height]).flat();
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const zoomX = (canvasWidth * 0.8) / contentWidth;
      const zoomY = (canvasHeight * 0.8) / contentHeight;
      const fitZoom = Math.min(zoomX, zoomY, 3);
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const panX = canvasWidth / 2 - centerX * fitZoom;
      const panY = canvasHeight / 2 - centerY * fitZoom;
      
      canvas.setZoom(fitZoom);
      canvas.setViewportTransform([fitZoom, 0, 0, fitZoom, panX, panY]);
      set({ zoom: fitZoom, panX, panY });
      canvas.requestRenderAll();
    } else if (selectedFrameId) {
      get().zoomToFrame(selectedFrameId, true);
    } else if (selectedElementId) {
      // Zoom to element's frame
      const frame = frames.find((f) => f.elements.some((el) => el.id === selectedElementId));
      if (frame) {
        get().zoomToFrame(frame.id, true);
      }
    }
  },
  
  // Undo/Redo
  saveHistory: () => {
    const { frames, path, history, historyIndex } = get();
    const newState: HistoryState = {
      frames: JSON.parse(JSON.stringify(frames)), // Deep clone
      path: [...path],
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
    const limitedHistory = newHistory.slice(-50);
    
    set({
      history: limitedHistory,
      historyIndex: limitedHistory.length - 1,
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    
    const prevState = history[historyIndex - 1];
    set({
      frames: JSON.parse(JSON.stringify(prevState.frames)),
      path: [...prevState.path],
      historyIndex: historyIndex - 1,
    });
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    
    const nextState = history[historyIndex + 1];
    set({
      frames: JSON.parse(JSON.stringify(nextState.frames)),
      path: [...nextState.path],
      historyIndex: historyIndex + 1,
    });
  },
  
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },
  
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
  
  // Copy/Paste
  copyFrames: (frameIds) => {
    const { frames } = get();
    const copiedFrames = frames
      .filter((f) => frameIds.includes(f.id))
      .map((f) => JSON.parse(JSON.stringify(f))); // Deep clone
    
    set({ clipboard: { frames: copiedFrames } });
  },
  
  copyElements: (frameId, elementIds) => {
    const { frames } = get();
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;
    
    const copiedElements = frame.elements
      .filter((el) => elementIds.includes(el.id))
      .map((el) => ({ frameId, element: JSON.parse(JSON.stringify(el)) }));
    
    set({ clipboard: { elements: copiedElements } });
  },
  
  paste: (offset = { x: 20, y: 20 }) => {
    const { clipboard, frames, canvas } = get();
    if (!clipboard) return;
    
    if (clipboard.frames) {
      // Paste frames
      const newFrameIds: string[] = [];
      clipboard.frames.forEach((frame) => {
        const newId = generateId();
        const newFrame: PresentationFrame = {
          ...frame,
          id: newId,
          position: {
            x: frame.position.x + offset.x,
            y: frame.position.y + offset.y,
          },
          title: frame.title ? `${frame.title} (Copy)` : undefined,
          elements: frame.elements.map((el) => ({
            ...el,
            id: generateElementId(),
          })),
        };
        newFrameIds.push(newId);
        set((state) => ({
          frames: [...state.frames, newFrame],
        }));
      });
      
      set({ selectedFrameIds: newFrameIds, selectedFrameId: newFrameIds[0] || null });
      setTimeout(() => get().saveHistory(), 0);
    } else if (clipboard.elements) {
      // Paste elements
      const targetFrameId = get().selectedFrameId || clipboard.elements[0]?.frameId;
      if (!targetFrameId) return;
      
      clipboard.elements.forEach(({ element }) => {
        const newElementId = generateElementId();
        const newElement: PresentationElement = {
          ...element,
          id: newElementId,
          position: {
            x: element.position.x + offset.x,
            y: element.position.y + offset.y,
          },
        };
        
        get().addElement(targetFrameId, newElement);
      });
    }
  },
  
  cutFrames: (frameIds) => {
    get().copyFrames(frameIds);
    frameIds.forEach((id) => get().deleteFrame(id));
  },
  
  cutElements: (frameId, elementIds) => {
    get().copyElements(frameId, elementIds);
    elementIds.forEach((id) => get().deleteElement(frameId, id));
  },
  
  // Align/Distribute
  alignFrames: (frameIds, alignment) => {
    const { frames } = get();
    if (frameIds.length < 2) return;
    
    const selectedFrames = frames.filter((f) => frameIds.includes(f.id));
    if (selectedFrames.length < 2) return;
    
    let targetValue: number;
    
    switch (alignment) {
      case 'left':
        targetValue = Math.min(...selectedFrames.map((f) => f.position.x));
        selectedFrames.forEach((frame) => {
          get().updateFrame(frame.id, { position: { ...frame.position, x: targetValue } });
        });
        break;
      case 'right':
        targetValue = Math.max(...selectedFrames.map((f) => f.position.x + f.width));
        selectedFrames.forEach((frame) => {
          get().updateFrame(frame.id, { position: { ...frame.position, x: targetValue - frame.width } });
        });
        break;
      case 'top':
        targetValue = Math.min(...selectedFrames.map((f) => f.position.y));
        selectedFrames.forEach((frame) => {
          get().updateFrame(frame.id, { position: { ...frame.position, y: targetValue } });
        });
        break;
      case 'bottom':
        targetValue = Math.max(...selectedFrames.map((f) => f.position.y + f.height));
        selectedFrames.forEach((frame) => {
          get().updateFrame(frame.id, { position: { ...frame.position, y: targetValue - frame.height } });
        });
        break;
      case 'center':
        const centerX = selectedFrames.reduce((sum, f) => sum + f.position.x + f.width / 2, 0) / selectedFrames.length;
        selectedFrames.forEach((frame) => {
          get().updateFrame(frame.id, { position: { ...frame.position, x: centerX - frame.width / 2 } });
        });
        break;
      case 'middle':
        const centerY = selectedFrames.reduce((sum, f) => sum + f.position.y + f.height / 2, 0) / selectedFrames.length;
        selectedFrames.forEach((frame) => {
          get().updateFrame(frame.id, { position: { ...frame.position, y: centerY - frame.height / 2 } });
        });
        break;
    }
  },
  
  distributeFrames: (frameIds, direction) => {
    const { frames } = get();
    if (frameIds.length < 3) return;
    
    const selectedFrames = frames.filter((f) => frameIds.includes(f.id));
    if (selectedFrames.length < 3) return;
    
    // Sort frames by position
    const sorted = [...selectedFrames].sort((a, b) => {
      if (direction === 'horizontal') {
        return a.position.x - b.position.x;
      } else {
        return a.position.y - b.position.y;
      }
    });
    
    if (direction === 'horizontal') {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalWidth = last.position.x + last.width - first.position.x;
      const framesWidth = sorted.reduce((sum, f) => sum + f.width, 0);
      const gap = (totalWidth - framesWidth) / (sorted.length - 1);
      
      let currentX = first.position.x;
      sorted.forEach((frame) => {
        get().updateFrame(frame.id, { position: { ...frame.position, x: currentX } });
        currentX += frame.width + gap;
      });
    } else {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalHeight = last.position.y + last.height - first.position.y;
      const framesHeight = sorted.reduce((sum, f) => sum + f.height, 0);
      const gap = (totalHeight - framesHeight) / (sorted.length - 1);
      
      let currentY = first.position.y;
      sorted.forEach((frame) => {
        get().updateFrame(frame.id, { position: { ...frame.position, y: currentY } });
        currentY += frame.height + gap;
      });
    }
  },
  
  // Navigation
  goToNextFrame: () => {
    const { path, currentFrameId } = get();
    if (path.length === 0) return;
    
    const currentIndex = currentFrameId ? path.indexOf(currentFrameId) : -1;
    const nextIndex = currentIndex < path.length - 1 ? currentIndex + 1 : 0;
    get().goToFrame(path[nextIndex]);
  },
  
  goToPreviousFrame: () => {
    const { path, currentFrameId } = get();
    if (path.length === 0) return;
    
    const currentIndex = currentFrameId ? path.indexOf(currentFrameId) : -1;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : path.length - 1;
    get().goToFrame(path[prevIndex]);
  },
  
  goToFrame: (frameId) => {
    const { frames } = get();
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;
    
    get().setSelectionMode('external');
    set({ currentFrameId: frameId, overviewMode: false }); // Exit overview when navigating to frame
    get().selectFrame(frameId);
    get().zoomToFrame(frameId, true);
  },
  
  // Prezi-like overview mode - uses main canvas
  setOverviewMode: (enabled) => {
    set({ overviewMode: enabled });
    if (enabled) {
      // Auto-fit canvas to show all frames when entering overview
      setTimeout(() => {
        get().fitCanvasToFrames();
      }, 100);
    }
  },
  
  toggleOverviewMode: () => {
    const { overviewMode } = get();
    get().setOverviewMode(!overviewMode);
  },
  
  // Frame management
  lockFrame: (id) => {
    get().updateFrame(id, { locked: true });
  },
  
  unlockFrame: (id) => {
    get().updateFrame(id, { locked: false });
  },
  
  lockFrames: (ids) => {
    ids.forEach((id) => get().lockFrame(id));
  },
  
  unlockFrames: (ids) => {
    ids.forEach((id) => get().unlockFrame(id));
  },
  
  duplicateFrames: (ids) => {
    const newIds: string[] = [];
    ids.forEach((id) => {
      const newId = get().duplicateFrame(id);
      if (newId) newIds.push(newId);
    });
    if (newIds.length > 0) {
      get().selectFrames(newIds);
    }
  },
  
  // Element alignment
  alignElements: (frameId, elementIds, alignment) => {
    const { frames } = get();
    if (elementIds.length < 2) return;
    
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;
    
    const selectedElements = frame.elements.filter((el) => elementIds.includes(el.id));
    if (selectedElements.length < 2) return;
    
    let targetValue: number;
    
    switch (alignment) {
      case 'left':
        targetValue = Math.min(...selectedElements.map((el) => el.position.x));
        selectedElements.forEach((element) => {
          get().updateElement(frameId, element.id, { position: { ...element.position, x: targetValue } });
        });
        break;
      case 'right':
        targetValue = Math.max(...selectedElements.map((el) => el.position.x + el.size.width));
        selectedElements.forEach((element) => {
          get().updateElement(frameId, element.id, { position: { ...element.position, x: targetValue - element.size.width } });
        });
        break;
      case 'top':
        targetValue = Math.min(...selectedElements.map((el) => el.position.y));
        selectedElements.forEach((element) => {
          get().updateElement(frameId, element.id, { position: { ...element.position, y: targetValue } });
        });
        break;
      case 'bottom':
        targetValue = Math.max(...selectedElements.map((el) => el.position.y + el.size.height));
        selectedElements.forEach((element) => {
          get().updateElement(frameId, element.id, { position: { ...element.position, y: targetValue - element.size.height } });
        });
        break;
      case 'center':
        const centerX = selectedElements.reduce((sum, el) => sum + el.position.x + el.size.width / 2, 0) / selectedElements.length;
        selectedElements.forEach((element) => {
          get().updateElement(frameId, element.id, { position: { ...element.position, x: centerX - element.size.width / 2 } });
        });
        break;
      case 'middle':
        const centerY = selectedElements.reduce((sum, el) => sum + el.position.y + el.size.height / 2, 0) / selectedElements.length;
        selectedElements.forEach((element) => {
          get().updateElement(frameId, element.id, { position: { ...element.position, y: centerY - element.size.height / 2 } });
        });
        break;
    }
    setTimeout(() => get().saveHistory(), 0);
  },
  
  distributeElements: (frameId, elementIds, direction) => {
    const { frames } = get();
    if (elementIds.length < 3) return;
    
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;
    
    const selectedElements = frame.elements.filter((el) => elementIds.includes(el.id));
    if (selectedElements.length < 3) return;
    
    // Sort elements by position
    const sorted = [...selectedElements].sort((a, b) => {
      if (direction === 'horizontal') {
        return a.position.x - b.position.x;
      } else {
        return a.position.y - b.position.y;
      }
    });
    
    if (direction === 'horizontal') {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalWidth = last.position.x + last.size.width - first.position.x;
      const elementsWidth = sorted.reduce((sum, el) => sum + el.size.width, 0);
      const gap = (totalWidth - elementsWidth) / (sorted.length - 1);
      
      let currentX = first.position.x;
      sorted.forEach((element) => {
        get().updateElement(frameId, element.id, { position: { ...element.position, x: currentX } });
        currentX += element.size.width + gap;
      });
    } else {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalHeight = last.position.y + last.size.height - first.position.y;
      const elementsHeight = sorted.reduce((sum, el) => sum + el.size.height, 0);
      const gap = (totalHeight - elementsHeight) / (sorted.length - 1);
      
      let currentY = first.position.y;
      sorted.forEach((element) => {
        get().updateElement(frameId, element.id, { position: { ...element.position, y: currentY } });
        currentY += element.size.height + gap;
      });
    }
    setTimeout(() => get().saveHistory(), 0);
  },
  
  // Group/Ungroup
  groupElements: (frameId, elementIds) => {
    const { frames } = get();
    if (elementIds.length < 2) return null;
    
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return null;
    
    const elementsToGroup = frame.elements.filter((el) => elementIds.includes(el.id));
    if (elementsToGroup.length < 2) return null;
    
    // Calculate group bounds
    const minX = Math.min(...elementsToGroup.map((el) => el.position.x));
    const minY = Math.min(...elementsToGroup.map((el) => el.position.y));
    const maxX = Math.max(...elementsToGroup.map((el) => el.position.x + el.size.width));
    const maxY = Math.max(...elementsToGroup.map((el) => el.position.y + el.size.height));
    
    const groupId = generateElementId();
    const groupElement: PresentationElement = {
      id: groupId,
      type: 'shape', // Use shape type for groups
      content: 'group',
      position: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY },
      rotation: 0,
      style: {},
    };
    
    // Store grouped element IDs in style metadata
    (groupElement.style as any).groupedElements = elementIds;
    
    // Remove individual elements and add group
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? {
              ...f,
              elements: [
                ...f.elements.filter((el) => !elementIds.includes(el.id)),
                groupElement,
              ],
            }
          : f
      ),
      selectedElementId: groupId,
      selectedElementIds: [groupId],
    }));
    
    setTimeout(() => get().saveHistory(), 0);
    return groupId;
  },
  
  ungroupElement: (frameId, elementId) => {
    const { frames } = get();
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;
    
    const groupElement = frame.elements.find((el) => el.id === elementId);
    if (!groupElement || (groupElement.style as any)?.groupedElements === undefined) return;
    
    const groupedElementIds = (groupElement.style as any).groupedElements as string[];
    if (!groupedElementIds || groupedElementIds.length === 0) return;
    
    // Find the original elements (they should still exist, just marked as grouped)
    // For now, we'll recreate them - in a real implementation, you'd store them differently
    // This is a simplified version - in production, you'd want to store the actual element data
    
    // Remove the group element
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? {
              ...f,
              elements: f.elements.filter((el) => el.id !== elementId),
            }
          : f
      ),
    }));
    
    setTimeout(() => get().saveHistory(), 0);
  },
  
  // Lock/Unlock elements
  lockElement: (frameId, elementId) => {
    get().updateElement(frameId, elementId, { style: { ...get().frames.find((f) => f.id === frameId)?.elements.find((el) => el.id === elementId)?.style, locked: true } });
  },
  
  unlockElement: (frameId, elementId) => {
    const frame = get().frames.find((f) => f.id === frameId);
    const element = frame?.elements.find((el) => el.id === elementId);
    if (element) {
      const { locked, ...restStyle } = element.style;
      get().updateElement(frameId, elementId, { style: restStyle });
    }
  },
  
  lockElements: (frameId, elementIds) => {
    elementIds.forEach((id) => get().lockElement(frameId, id));
  },
  
  unlockElements: (frameId, elementIds) => {
    elementIds.forEach((id) => get().unlockElement(frameId, id));
  },
  
  // Export canvas
  exportCanvas: async (format: 'png' | 'jpg' | 'svg') => {
    const { canvas } = get();
    if (!canvas) return null;
    
    try {
      if (format === 'svg') {
        const svg = canvas.toSVG();
        return svg;
      } else {
        const fabricFormat = format === 'jpg' ? 'jpeg' : format;
        const dataURL = canvas.toDataURL({
          format: fabricFormat,
          quality: 0.9,
          multiplier: 2, // Higher resolution
        });
        return dataURL;
      }
    } catch (error) {
      console.error('Export error:', error);
      return null;
    }
  },
}));

