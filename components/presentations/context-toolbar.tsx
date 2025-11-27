"use client";

import { useEffect, useState } from "react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  Link as LinkIcon,
  Image as ImageIcon,
  Crop,
  Layers,
  Lock,
  Trash2,
  MoreHorizontal,
  MoveUp,
  MoveDown
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ContextToolbar() {
  const {
    frames,
    selectedFrameId,
    selectedElementId,
    updateElement,
    deleteElement,
  } = usePresentationEditorStore();

  const [selectedElement, setSelectedElement] = useState<any>(null);

  useEffect(() => {
    if (selectedFrameId && selectedElementId) {
      const frame = frames.find(f => f.id === selectedFrameId);
      const element = frame?.elements.find(e => e.id === selectedElementId);
      setSelectedElement(element || null);
    } else {
      setSelectedElement(null);
    }
  }, [frames, selectedFrameId, selectedElementId]);

  if (!selectedElement) return null;

  const handleUpdate = (updates: any) => {
    if (selectedFrameId && selectedElementId) {
      updateElement(selectedFrameId, selectedElementId, updates);
    }
  };

  const handleStyleUpdate = (styleUpdates: any) => {
    handleUpdate({
      style: {
        ...selectedElement.style,
        ...styleUpdates
      }
    });
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1.5 flex items-center gap-1 z-50 animate-in fade-in slide-in-from-top-2">
      
      {/* Text Formatting */}
      {selectedElement.type === 'text' && (
        <>
          <Select
            value={selectedElement.style?.fontFamily || "Arial"}
            onValueChange={(value) => handleStyleUpdate({ fontFamily: value })}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border-l border-gray-200 dark:border-gray-700 mx-1 px-1">
            <Input
              type="number"
              className="w-12 h-8 text-xs border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-center p-0"
              value={selectedElement.style?.fontSize || 24}
              onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) || 24 })}
            />
            <div className="flex flex-col -space-y-1 ml-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-3 w-3 rounded-none"
                onClick={() => handleStyleUpdate({ fontSize: (selectedElement.style?.fontSize || 24) + 1 })}
              >
                <span className="text-[8px]">▲</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-3 w-3 rounded-none"
                onClick={() => handleStyleUpdate({ fontSize: (selectedElement.style?.fontSize || 24) - 1 })}
              >
                <span className="text-[8px]">▼</span>
              </Button>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={selectedElement.style?.fontWeight === 'bold' ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleStyleUpdate({ fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedElement.style?.fontStyle === 'italic' ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleStyleUpdate({ fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedElement.style?.textDecoration === 'underline' ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleStyleUpdate({ textDecoration: selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline' })}
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: selectedElement.style?.fill || '#000000' }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="grid grid-cols-5 gap-1">
                {['#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#71717a'].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleStyleUpdate({ fill: color })}
                  />
                ))}
              </div>
              <div className="mt-2 pt-2 border-t">
                <Input 
                  type="color" 
                  className="w-full h-8"
                  value={selectedElement.style?.fill || '#000000'}
                  onChange={(e) => handleStyleUpdate({ fill: e.target.value })}
                />
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Shape/Image Styling */}
      {(selectedElement.type === 'shape' || selectedElement.type === 'image') && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Fill Color">
                <Palette className="h-4 w-4" />
                <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white" style={{ backgroundColor: selectedElement.style?.fill || '#3b82f6' }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="grid grid-cols-5 gap-1">
                {['#3b82f6', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#000000', '#ffffff', 'transparent'].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform relative"
                    style={{ backgroundColor: color === 'transparent' ? 'white' : color }}
                    onClick={() => handleStyleUpdate({ fill: color })}
                  >
                    {color === 'transparent' && <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">/</div>}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1 px-1">
            <span className="text-xs text-gray-500">Opacity</span>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              className="w-20 h-6"
              value={selectedElement.style?.opacity ?? 1}
              onChange={(e) => handleStyleUpdate({ opacity: parseFloat(e.target.value) })}
            />
          </div>
        </>
      )}

      {/* Image Specific */}
      {selectedElement.type === 'image' && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Crop">
            <Crop className="h-4 w-4" />
          </Button>
        </>
      )}

      <Separator orientation="vertical" className="h-6" />

      {/* Common Actions */}
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Add Link">
        <LinkIcon className="h-4 w-4" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Layer Order">
            <Layers className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <MoveUp className="mr-2 h-4 w-4" /> Bring Forward
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MoveDown className="mr-2 h-4 w-4" /> Send Backward
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" className="h-8 w-8" title="Lock">
        <Lock className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" 
        title="Delete"
        onClick={() => selectedFrameId && selectedElementId && deleteElement(selectedFrameId, selectedElementId)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

    </div>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
