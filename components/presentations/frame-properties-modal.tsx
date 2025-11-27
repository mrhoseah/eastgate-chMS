"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { Trash2, Lock, Unlock, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface FramePropertiesModalProps {
  frameId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FramePropertiesModal({ frameId, open, onOpenChange }: FramePropertiesModalProps) {
  const { frames, updateFrame, deleteFrame, selectFrame } = usePresentationEditorStore();
  
  const frame = frameId ? frames.find((f) => f.id === frameId) : null;

  if (!frame) return null;

  const [title, setTitle] = useState(frame.title || "");
  const [width, setWidth] = useState(frame.width.toString());
  const [height, setHeight] = useState(frame.height.toString());
  const [backgroundColor, setBackgroundColor] = useState(frame.backgroundColor || "#ffffff");
  const [borderColor, setBorderColor] = useState(frame.borderColor || "#e5e7eb");
  const [notes, setNotes] = useState(frame.notes || "");
  const [locked, setLocked] = useState(frame.locked || false);

  useEffect(() => {
    if (frame) {
      setTitle(frame.title || "");
      setWidth(frame.width.toString());
      setHeight(frame.height.toString());
      setBackgroundColor(frame.backgroundColor || "#ffffff");
      setBorderColor(frame.borderColor || "#e5e7eb");
      setNotes(frame.notes || "");
      setLocked(frame.locked || false);
    }
  }, [frame]);

  const handleSave = () => {
    if (!frameId) return;
    
    updateFrame(frameId, {
      title: title.trim() || undefined,
      width: parseFloat(width) || frame.width,
      height: parseFloat(height) || frame.height,
      backgroundColor,
      borderColor,
      notes: notes.trim() || undefined,
      locked,
    });
    
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!frameId) return;
    deleteFrame(frameId);
    selectFrame(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Frame Properties</DialogTitle>
          <DialogDescription className="text-gray-400">
            Edit the properties of this slide
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-300">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Slide"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <Separator className="bg-gray-800" />

          {/* Dimensions */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-300">Dimensions</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-xs text-gray-400">
                  Width (px)
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-xs text-gray-400">
                  Height (px)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Colors */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-300">Colors</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor" className="text-xs text-gray-400">
                  Background Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-20 bg-gray-800 border-gray-700 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700 text-white font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="borderColor" className="text-xs text-gray-400">
                  Border Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="borderColor"
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="h-10 w-20 bg-gray-800 border-gray-700 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700 text-white font-mono text-sm"
                    placeholder="#e5e7eb"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Lock/Unlock */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">Protection</Label>
            <Button
              variant={locked ? "default" : "outline"}
              size="sm"
              onClick={() => setLocked(!locked)}
              className={`w-full justify-start ${locked ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border-yellow-600/30' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
            >
              {locked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              {locked ? 'Frame is Locked' : 'Lock Frame'}
            </Button>
            <p className="text-xs text-gray-500">
              Locked frames cannot be moved, resized, or rotated
            </p>
          </div>

          <Separator className="bg-gray-800" />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Presenter Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this slide (visible only in editor)..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            />
            <p className="text-xs text-gray-500">
              These notes are only visible in the editor, not during presentation
            </p>
          </div>

          <Separator className="bg-gray-800" />

          {/* Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">Information</Label>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Position: {Math.round(frame.position.x)}, {Math.round(frame.position.y)}</div>
              <div>Rotation: {Math.round(frame.rotation || 0)}°</div>
              <div>Elements: {frame.elements.length}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Frame
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

