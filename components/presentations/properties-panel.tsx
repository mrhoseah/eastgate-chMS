"use client";

import { useState } from "react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Trash2,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignTop,
  AlignMiddle,
  AlignBottom,
  MoveUp,
  MoveDown,
  RotateCw,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertiesPanelProps {
  frameId: string;
}

export function PropertiesPanel({ frameId }: PropertiesPanelProps) {
  const { toast } = useToast();
  const {
    frames,
    selectedElementId,
    updateElement,
    deleteElement,
    duplicateElement,
    selectElement,
  } = usePresentationEditorStore();

  const frame = frames.find((f) => f.id === frameId);
  const selectedElement = frame?.elements.find((e) => e.id === selectedElementId);
  const { updateFrame } = usePresentationEditorStore();

  if (!frame) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No frame selected
      </div>
    );
  }

  // Show slide properties when no element is selected
  if (!selectedElementId || !selectedElement) {
    return (
      <div className="p-4 space-y-4">
        <div className="border-b pb-3">
          <h3 className="font-semibold text-sm">Slide Properties</h3>
          <p className="text-xs text-gray-500 mt-1">Edit current slide settings</p>
        </div>

        {/* Slide Title */}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Slide Title</Label>
          <Input
            type="text"
            value={frame.title || ""}
            onChange={(e) => updateFrame(frameId, { title: e.target.value })}
            className="h-8 text-xs"
            placeholder="Enter slide title"
          />
        </div>

        {/* Background Color */}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Background Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={frame.backgroundColor || "#ffffff"}
              onChange={(e) => updateFrame(frameId, { backgroundColor: e.target.value })}
              className="w-16 h-8 p-0 border-0 cursor-pointer"
            />
            <Input
              type="text"
              value={frame.backgroundColor || "#ffffff"}
              onChange={(e) => updateFrame(frameId, { backgroundColor: e.target.value })}
              className="flex-1 h-8 text-xs"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Quick Background Colors */}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Quick Colors</Label>
          <div className="grid grid-cols-5 gap-2">
            {[
              "#ffffff", "#000000", "#3b82f6", "#10b981", "#f59e0b",
              "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
            ].map((color) => (
              <button
                key={color}
                onClick={() => updateFrame(frameId, { backgroundColor: color })}
                className={`w-full h-8 rounded border-2 transition-all ${
                  frame.backgroundColor === color
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Background Image */}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Background Image</Label>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 h-8 text-xs"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event: any) => {
                    updateFrame(frameId, {
                      backgroundColor: event.target.result,
                    });
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            <ImageIcon className="w-3 h-3" />
            Choose Image...
          </Button>
        </div>

        {/* Theme */}
        <div className="border-t pt-3">
          <Label className="text-xs text-gray-500 mb-1.5 block">Theme</Label>
          <div className="space-y-2">
            {[
              { name: 'Sales dark', id: 'dark', bg: '#1a1a1a', text: '#ffffff' },
              { name: 'Sales light', id: 'light', bg: '#ffffff', text: '#000000' }
            ].map((style) => (
              <div
                key={style.id}
                onClick={() => {
                  updateFrame(frameId, { backgroundColor: style.bg });
                }}
                className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted"
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border ${
                  style.id === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'
                }`}>
                  Aa
                </div>
                <span className="text-xs">{style.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slide Dimensions Info */}
        <div className="border-t pt-3">
          <Label className="text-xs text-gray-500 mb-1.5 block">Slide Dimensions</Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-400">Width</div>
              <div className="font-semibold">{frame.width || 960}px</div>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-400">Height</div>
              <div className="font-semibold">{frame.height || 540}px</div>
            </div>
          </div>
        </div>

        {/* Elements Count */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Elements on slide</span>
            <span className="font-semibold">{frame.elements?.length || 0}</span>
          </div>
        </div>

        {/* Help Text */}
        <div className="border-t pt-3">
          <p className="text-xs text-gray-400">
            💡 Select an object on the slide to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: any) => {
    updateElement(frameId, selectedElementId!, updates);
  };

  const handleDuplicate = () => {
    const newId = duplicateElement(frameId, selectedElementId!);
    if (newId) {
      toast({
        title: "Duplicated",
        description: "Object duplicated successfully",
      });
    }
  };

  const handleDelete = () => {
    deleteElement(frameId, selectedElementId!);
    selectElement(frameId, null);
    toast({
      title: "Deleted",
      description: "Object deleted successfully",
    });
  };

  const handleLayerChange = (direction: "up" | "down") => {
    // Find element index and swap with adjacent element
    const elementIndex = frame!.elements.findIndex((e) => e.id === selectedElementId);
    if (elementIndex === -1) return;

    const newElements = [...frame!.elements];
    if (direction === "up" && elementIndex < newElements.length - 1) {
      [newElements[elementIndex], newElements[elementIndex + 1]] = [
        newElements[elementIndex + 1],
        newElements[elementIndex],
      ];
    } else if (direction === "down" && elementIndex > 0) {
      [newElements[elementIndex], newElements[elementIndex - 1]] = [
        newElements[elementIndex - 1],
        newElements[elementIndex],
      ];
    }

    // Update frame with new element order
    const { updateFrame } = usePresentationEditorStore.getState();
    updateFrame(frameId, { elements: newElements });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-semibold text-sm">Properties</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            title="Delete"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Position & Size */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-400">X</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.position.x)}
                onChange={(e) =>
                  handleUpdate({
                    position: {
                      ...selectedElement.position,
                      x: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.position.y)}
                onChange={(e) =>
                  handleUpdate({
                    position: {
                      ...selectedElement.position,
                      y: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-400">Width</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.size.width)}
                onChange={(e) =>
                  handleUpdate({
                    size: {
                      ...selectedElement.size,
                      width: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Height</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.size.height)}
                onChange={(e) =>
                  handleUpdate({
                    size: {
                      ...selectedElement.size,
                      height: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Rotation</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={Math.round(selectedElement.rotation)}
              onChange={(e) =>
                handleUpdate({
                  rotation: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8 text-xs flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdate({ rotation: (selectedElement.rotation + 90) % 360 })}
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Style Properties */}
      {selectedElement.type !== "text" && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Fill Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={selectedElement.style?.fill || "#3b82f6"}
                onChange={(e) =>
                  handleUpdate({
                    style: {
                      ...selectedElement.style,
                      fill: e.target.value,
                    },
                  })
                }
                className="w-16 h-8 p-0 border-0 cursor-pointer"
              />
              <Input
                type="text"
                value={selectedElement.style?.fill || "#3b82f6"}
                onChange={(e) =>
                  handleUpdate({
                    style: {
                      ...selectedElement.style,
                      fill: e.target.value,
                    },
                  })
                }
                className="flex-1 h-8 text-xs"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Stroke</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={selectedElement.style?.stroke || "#000000"}
                onChange={(e) =>
                  handleUpdate({
                    style: {
                      ...selectedElement.style,
                      stroke: e.target.value,
                    },
                  })
                }
                className="w-16 h-8 p-0 border-0 cursor-pointer"
              />
              <Input
                type="number"
                value={selectedElement.style?.strokeWidth || 0}
                onChange={(e) =>
                  handleUpdate({
                    style: {
                      ...selectedElement.style,
                      strokeWidth: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-20 h-8 text-xs"
                placeholder="Width"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Opacity</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={selectedElement.style?.opacity || 1}
              onChange={(e) =>
                handleUpdate({
                  style: {
                    ...selectedElement.style,
                    opacity: parseFloat(e.target.value) || 1,
                  },
                })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* Text Properties */}
      {selectedElement.type === "text" && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Content</Label>
            <Textarea
              value={selectedElement.content || ""}
              onChange={(e) =>
                handleUpdate({
                  content: e.target.value,
                })
              }
              className="min-h-[80px] text-xs resize-y"
              placeholder="Enter text content..."
            />
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Font Size</Label>
            <Input
              type="number"
              value={selectedElement.style?.fontSize || 24}
              onChange={(e) =>
                handleUpdate({
                  style: {
                    ...selectedElement.style,
                    fontSize: parseFloat(e.target.value) || 24,
                  },
                })
              }
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Font Family</Label>
            <Select
              value={selectedElement.style?.fontFamily || "Arial"}
              onValueChange={(value) =>
                handleUpdate({
                  style: {
                    ...selectedElement.style,
                    fontFamily: value,
                  },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={selectedElement.style?.fill || "#000000"}
                onChange={(e) =>
                  handleUpdate({
                    style: {
                      ...selectedElement.style,
                      fill: e.target.value,
                    },
                  })
                }
                className="w-16 h-8 p-0 border-0 cursor-pointer"
              />
              <Input
                type="text"
                value={selectedElement.style?.fill || "#000000"}
                onChange={(e) =>
                  handleUpdate({
                    style: {
                      ...selectedElement.style,
                      fill: e.target.value,
                    },
                  })
                }
                className="flex-1 h-8 text-xs"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Properties */}
      {selectedElement.type === "image" && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Image Source</Label>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event: any) => {
                        handleUpdate({
                          content: event.target.result,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                <ImageIcon className="w-3 h-3" />
                Change Image...
              </Button>
              <Input
                value={selectedElement.content || ""}
                onChange={(e) => handleUpdate({ content: e.target.value })}
                placeholder="Image URL"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Video Properties */}
      {selectedElement.type === "video" && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Video URL</Label>
            <Input
              value={selectedElement.content || ""}
              onChange={(e) => handleUpdate({ content: e.target.value })}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* Layer Management */}
      <div className="border-t pt-3">
        <Label className="text-xs text-gray-500 mb-2 block">Layer</Label>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLayerChange("up")}
            title="Bring Forward"
            className="flex-1"
          >
            <MoveUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLayerChange("down")}
            title="Send Backward"
            className="flex-1"
          >
            <MoveDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

