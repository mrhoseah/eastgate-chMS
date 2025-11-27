"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Lightbulb, Palette, Layout, CheckCircle, X } from "lucide-react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  id: string;
  type: 'layout' | 'design' | 'content' | 'accessibility';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: () => void;
}

interface SmartSuggestionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmartSuggestions({ open, onOpenChange }: SmartSuggestionsProps) {
  const { frames, selectedFrameId, updateFrame, alignFrames, selectedFrameIds } = usePresentationEditorStore();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      generateSuggestions();
    }
  }, [open, frames, selectedFrameId]);

  const generateSuggestions = () => {
    const newSuggestions: Suggestion[] = [];

    // Layout suggestions
    if (selectedFrameIds.length >= 2) {
      newSuggestions.push({
        id: 'align-frames',
        type: 'layout',
        title: 'Align Selected Frames',
        description: `${selectedFrameIds.length} frames selected. Consider aligning them for better organization.`,
        priority: 'medium',
        action: () => {
          alignFrames(selectedFrameIds, 'left');
          toast({ title: "Frames Aligned", description: "Selected frames have been aligned" });
        },
      });
    }

    // Design suggestions
    if (frames.length > 0) {
      const framesWithSameBg = frames.filter(f => f.backgroundColor === frames[0].backgroundColor);
      if (framesWithSameBg.length === frames.length && frames.length > 1) {
        newSuggestions.push({
          id: 'varied-backgrounds',
          type: 'design',
          title: 'Add Visual Variety',
          description: 'All frames have the same background color. Consider using different colors for visual interest.',
          priority: 'low',
        });
      }
    }

    // Content suggestions
    const framesWithoutTitles = frames.filter(f => !f.title || f.title.trim() === '');
    if (framesWithoutTitles.length > 0) {
      newSuggestions.push({
        id: 'add-titles',
        type: 'content',
        title: 'Add Titles to Frames',
        description: `${framesWithoutTitles.length} frame(s) don't have titles. Adding titles helps with organization.`,
        priority: 'medium',
      });
    }

    // Accessibility suggestions
    const smallTextFrames = frames.filter(f => 
      f.elements.some(el => el.style?.fontSize && el.style.fontSize < 16)
    );
    if (smallTextFrames.length > 0) {
      newSuggestions.push({
        id: 'increase-font-size',
        type: 'accessibility',
        title: 'Improve Readability',
        description: 'Some text elements may be too small for viewers. Consider increasing font sizes.',
        priority: 'high',
      });
    }

    setSuggestions(newSuggestions.filter(s => !dismissed.has(s.id)));
  };

  const handleDismiss = (id: string) => {
    setDismissed(new Set([...dismissed, id]));
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  const handleApply = (suggestion: Suggestion) => {
    if (suggestion.action) {
      suggestion.action();
    }
    handleDismiss(suggestion.id);
  };

  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'layout':
        return <Layout className="w-4 h-4" />;
      case 'design':
        return <Palette className="w-4 h-4" />;
      case 'content':
        return <Lightbulb className="w-4 h-4" />;
      case 'accessibility':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-600/20 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-600/20 border-yellow-500/30';
      case 'low':
        return 'text-blue-400 bg-blue-600/20 border-blue-500/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Smart Suggestions
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            AI-powered recommendations to improve your presentation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {suggestions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                <p className="text-gray-400 mb-2">No suggestions at the moment</p>
                <p className="text-xs text-gray-500">Keep creating and we'll provide helpful recommendations</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 p-2">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                        {getIcon(suggestion.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white">{suggestion.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{suggestion.description}</p>
                        <div className="flex gap-2">
                          {suggestion.action && (
                            <Button
                              size="sm"
                              onClick={() => handleApply(suggestion)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                            >
                              Apply
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismiss(suggestion.id)}
                            className="text-gray-400 hover:text-gray-300 text-xs h-7"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(suggestion.id)}
                        className="text-gray-500 hover:text-gray-400 h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

