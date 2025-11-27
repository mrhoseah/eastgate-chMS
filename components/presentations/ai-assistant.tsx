"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, Lightbulb, BookOpen, Music, Calendar } from "lucide-react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { useToast } from "@/hooks/use-toast";

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickPrompts = [
  { icon: <BookOpen className="w-4 h-4" />, text: "Generate sermon outline", prompt: "Create a sermon outline on faith with 3 main points" },
  { icon: <Music className="w-4 h-4" />, text: "Suggest worship songs", prompt: "Suggest 5 worship songs for a service about hope" },
  { icon: <Calendar className="w-4 h-4" />, text: "Plan service order", prompt: "Create a 60-minute Sunday service order" },
  { icon: <Lightbulb className="w-4 h-4" />, text: "Content ideas", prompt: "Give me 5 announcement ideas for this week" },
];

export function AIAssistant({ open, onOpenChange }: AIAssistantProps) {
  const { addFrame, addElement, canvas, zoom, panX, panY, frames } = usePresentationEditorStore();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMessage = prompt;
    setPrompt("");
    setIsLoading(true);
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    // Simulate AI response (in production, this would call an AI API)
    setTimeout(() => {
      let response = "";
      
      if (userMessage.toLowerCase().includes("sermon") || userMessage.toLowerCase().includes("outline")) {
        response = "Here's a sermon outline:\n\n1. Introduction: The Power of Faith\n2. Main Point 1: Faith Requires Action\n3. Main Point 2: Faith Overcomes Obstacles\n4. Main Point 3: Faith Transforms Lives\n5. Conclusion: Living by Faith\n\nWould you like me to create slides for this outline?";
      } else if (userMessage.toLowerCase().includes("worship") || userMessage.toLowerCase().includes("song")) {
        response = "Here are 5 worship songs for a service about hope:\n\n1. 'Great is Thy Faithfulness'\n2. 'Blessed Be Your Name'\n3. 'In Christ Alone'\n4. 'How Great is Our God'\n5. '10,000 Reasons'\n\nWould you like me to create a worship set slide?";
      } else if (userMessage.toLowerCase().includes("service") || userMessage.toLowerCase().includes("order")) {
        response = "Here's a 60-minute service order:\n\n1. Welcome (2 min)\n2. Opening Worship (15 min)\n3. Scripture Reading (3 min)\n4. Sermon (30 min)\n5. Offering (5 min)\n6. Closing Prayer (3 min)\n7. Benediction (2 min)\n\nWould you like me to generate slides for this service?";
      } else if (userMessage.toLowerCase().includes("announcement")) {
        response = "Here are 5 announcement ideas:\n\n1. Upcoming Bible Study starting next week\n2. Youth Group event this Friday\n3. Community service opportunity\n4. Prayer meeting on Wednesday\n5. Special guest speaker next Sunday\n\nWould you like me to create announcement slides?";
      } else {
        response = "I can help you with:\n- Creating sermon outlines\n- Planning service orders\n- Suggesting worship songs\n- Generating content ideas\n- Creating slides from your content\n\nWhat would you like help with?";
      }

      setConversation(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  const handleGenerateSlides = (content: string) => {
    // Parse content and generate slides
    const lines = content.split('\n').filter(l => l.trim() && !l.match(/^\d+\./));
    const numberedItems = content.split('\n').filter(l => l.match(/^\d+\./));
    
    if (numberedItems.length > 0) {
      const centerX = canvas ? (canvas.getWidth() / 2 - panX) / zoom : 500;
      const centerY = canvas ? (canvas.getHeight() / 2 - panY) / zoom : 500;
      
      numberedItems.forEach((item, index) => {
        const text = item.replace(/^\d+\.\s*/, '').trim();
        if (!text) return;

        const frameId = addFrame({
          title: text.substring(0, 30),
          position: {
            x: centerX - 320 + (index % 3) * 50,
            y: centerY - 180 + Math.floor(index / 3) * 200,
          },
          scale: 1,
          rotation: 0,
          width: 640,
          height: 360,
          backgroundColor: index === 0 ? '#1e293b' : '#ffffff',
          borderColor: '#e5e7eb',
        });

        setTimeout(() => {
          addElement(frameId, {
            type: 'text',
            content: text,
            position: { x: 50, y: 100 },
            size: { width: 540, height: 200 },
            rotation: 0,
            style: {
              fontSize: index === 0 ? 32 : 24,
              fontWeight: index === 0 ? 'bold' : 'normal',
              color: index === 0 ? '#ffffff' : '#1a1a2e',
              textAlign: 'center',
            },
          });
        }, 100 * (index + 1));
      });

      toast({
        title: "Slides Generated",
        description: `Created ${numberedItems.length} slides from AI content`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Assistant
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Get help with sermon outlines, service planning, and content suggestions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Quick Prompts */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Quick Actions</label>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((qp, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(qp.prompt)}
                  className="justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {qp.icon}
                  <span className="ml-2 text-xs">{qp.text}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="text-sm font-medium text-gray-300 mb-2">Conversation</label>
            <ScrollArea className="flex-1 border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              {conversation.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400/50" />
                  <p>Start a conversation to get AI assistance</p>
                  <p className="text-xs mt-2">Try asking about sermon outlines, service planning, or content ideas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.role === 'assistant' && msg.content.includes('\n') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateSlides(msg.content)}
                            className="mt-2 text-xs h-7 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300"
                          >
                            Generate Slides
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything about your presentation..."
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !prompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

