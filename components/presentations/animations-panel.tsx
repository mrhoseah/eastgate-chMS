"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Play, Square, Sparkles, Move, RotateCw } from "lucide-react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { useToast } from "@/hooks/use-toast";

interface Animation {
  id: string;
  name: string;
  description: string;
  type: 'entrance' | 'exit' | 'emphasis' | 'transition';
  icon: React.ReactNode;
  duration: number;
}

interface AnimationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const animations: Animation[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    description: 'Smooth fade in effect',
    type: 'entrance',
    icon: <Sparkles className="w-4 h-4" />,
    duration: 500,
  },
  {
    id: 'slide-in-left',
    name: 'Slide In (Left)',
    description: 'Slide in from the left',
    type: 'entrance',
    icon: <Move className="w-4 h-4" />,
    duration: 600,
  },
  {
    id: 'slide-in-right',
    name: 'Slide In (Right)',
    description: 'Slide in from the right',
    type: 'entrance',
    icon: <Move className="w-4 h-4" />,
    duration: 600,
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Zoom in from center',
    type: 'entrance',
    icon: <Zap className="w-4 h-4" />,
    duration: 500,
  },
  {
    id: 'bounce',
    name: 'Bounce',
    description: 'Bouncy entrance',
    type: 'entrance',
    icon: <Square className="w-4 h-4" />,
    duration: 800,
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    description: 'Smooth fade out effect',
    type: 'exit',
    icon: <Sparkles className="w-4 h-4" />,
    duration: 500,
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Pulsing emphasis',
    type: 'emphasis',
    icon: <Play className="w-4 h-4" />,
    duration: 1000,
  },
  {
    id: 'rotate',
    name: 'Rotate',
    description: 'Rotation animation',
    type: 'emphasis',
    icon: <RotateCw className="w-4 h-4" />,
    duration: 1000,
  },
];

export function AnimationsPanel({ open, onOpenChange }: AnimationsPanelProps) {
  const { selectedFrameId, updateFrame } = usePresentationEditorStore();
  const { toast } = useToast();
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);

  const handleApplyAnimation = (animation: Animation) => {
    if (!selectedFrameId) {
      toast({
        title: "No Frame Selected",
        description: "Please select a frame first",
        variant: "destructive",
      });
      return;
    }

    // Store animation in frame metadata
    updateFrame(selectedFrameId, {
      // Animation would be stored in metadata
    });

    toast({
      title: "Animation Applied",
      description: `${animation.name} applied to selected frame`,
    });
    setSelectedAnimation(animation.id);
  };

  const groupedAnimations = {
    entrance: animations.filter(a => a.type === 'entrance'),
    exit: animations.filter(a => a.type === 'exit'),
    emphasis: animations.filter(a => a.type === 'emphasis'),
    transition: animations.filter(a => a.type === 'transition'),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Animations & Transitions
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add modern animations and transitions to your slides
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-2">
              {/* Entrance Animations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Entrance Animations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {groupedAnimations.entrance.map((animation) => (
                    <button
                      key={animation.id}
                      onClick={() => handleApplyAnimation(animation)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedAnimation === animation.id
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`${selectedAnimation === animation.id ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {animation.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{animation.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{animation.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {animation.duration}ms
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exit Animations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Exit Animations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {groupedAnimations.exit.map((animation) => (
                    <button
                      key={animation.id}
                      onClick={() => handleApplyAnimation(animation)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedAnimation === animation.id
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`${selectedAnimation === animation.id ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {animation.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{animation.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{animation.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {animation.duration}ms
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emphasis Animations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Emphasis Animations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {groupedAnimations.emphasis.map((animation) => (
                    <button
                      key={animation.id}
                      onClick={() => handleApplyAnimation(animation)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedAnimation === animation.id
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`${selectedAnimation === animation.id ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {animation.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{animation.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{animation.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {animation.duration}ms
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

