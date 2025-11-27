"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Route, X, Plus, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Slide {
  id: string;
  title: string;
  x: number;
  y: number;
}

interface PathEditorProps {
  slides: Slide[];
  path: string[]; // Array of slide IDs in presentation order
  onPathChange: (newPath: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PathEditor({
  slides,
  path,
  onPathChange,
  open,
  onOpenChange,
}: PathEditorProps) {
  const [localPath, setLocalPath] = useState<string[]>(path);

  // Sync localPath with path prop when it changes
  useEffect(() => {
    setLocalPath(path);
  }, [path]);

  const handleAddSlide = (slideId: string) => {
    if (!localPath.includes(slideId)) {
      setLocalPath([...localPath, slideId]);
    }
  };

  const handleRemoveSlide = (index: number) => {
    setLocalPath(localPath.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newPath = [...localPath];
      [newPath[index - 1], newPath[index]] = [newPath[index], newPath[index - 1]];
      setLocalPath(newPath);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < localPath.length - 1) {
      const newPath = [...localPath];
      [newPath[index], newPath[index + 1]] = [newPath[index + 1], newPath[index]];
      setLocalPath(newPath);
    }
  };

  const handleSave = () => {
    onPathChange(localPath);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalPath(path); // Reset to original path
    onOpenChange(false);
  };

  const availableSlides = slides.filter((slide) => !localPath.includes(slide.id));

  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-[60vh] pr-4">
        <div className="space-y-4">
          {/* Current Path */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded"></div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Presentation Path ({localPath.length} {localPath.length === 1 ? 'slide' : 'slides'})
              </h3>
            </div>
            <div className="space-y-2">
              {localPath.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 italic">No slides in path. Add slides below.</p>
                </div>
              ) : (
                localPath.map((slideId, index) => {
                  const slide = slides.find((s) => s.id === slideId);
                  if (!slide) return null;
                  return (
                    <div
                      key={slideId}
                      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group"
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <GripVertical className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                        <Badge 
                          variant="outline" 
                          className="w-8 h-8 flex items-center justify-center bg-blue-600/20 border-blue-500/50 text-blue-400 font-bold"
                        >
                          {index + 1}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{slide.title}</p>
                        <p className="text-xs text-gray-500">Position: ({Math.round(slide.x)}, {Math.round(slide.y)})</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localPath.length - 1}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSlide(index)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Remove from path"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Available Slides */}
          {availableSlides.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-gradient-to-b from-gray-600 to-gray-700 rounded"></div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Available Slides ({availableSlides.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableSlides.map((slide) => (
                  <Button
                    key={slide.id}
                    variant="outline"
                    onClick={() => handleAddSlide(slide.id)}
                    className="justify-start h-auto p-3 bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-medium text-sm truncate">{slide.title}</p>
                      <p className="text-xs text-gray-500">Click to add</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Save Path
        </Button>
      </div>
    </div>
  );
}

