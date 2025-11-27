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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Megaphone, 
  Music, 
  Calendar, 
  Heart, 
  Users,
  FileText,
  Sparkles
} from "lucide-react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'sermon' | 'announcement' | 'worship' | 'service' | 'prayer' | 'other';
  icon: React.ReactNode;
  frames: Array<{
    title: string;
    width: number;
    height: number;
    backgroundColor: string;
    elements: Array<{
      type: 'text';
      content: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      style: {
        fontSize: number;
        fontWeight?: string;
        color: string;
        textAlign?: string;
      };
    }>;
  }>;
}

const templates: Template[] = [
  {
    id: 'sermon-title',
    name: 'Sermon Title Slide',
    description: 'Title slide with sermon title and speaker',
    category: 'sermon',
    icon: <BookOpen className="w-5 h-5" />,
    frames: [{
      title: 'Sermon Title',
      width: 640,
      height: 360,
      backgroundColor: '#1a1a2e',
      elements: [
        {
          type: 'text',
          content: 'Sermon Title',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 80 },
          style: {
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Speaker Name',
          position: { x: 50, y: 220 },
          size: { width: 540, height: 40 },
          style: {
            fontSize: 24,
            color: '#a0a0a0',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'sermon-point',
    name: 'Sermon Point',
    description: 'Slide for sermon points or key messages',
    category: 'sermon',
    icon: <FileText className="w-5 h-5" />,
    frames: [{
      title: 'Point',
      width: 640,
      height: 360,
      backgroundColor: '#ffffff',
      elements: [
        {
          type: 'text',
          content: 'Point 1',
          position: { x: 50, y: 50 },
          size: { width: 540, height: 60 },
          style: {
            fontSize: 36,
            fontWeight: 'bold',
            color: '#1a1a2e',
            textAlign: 'left',
          },
        },
        {
          type: 'text',
          content: 'Your point content goes here...',
          position: { x: 50, y: 130 },
          size: { width: 540, height: 180 },
          style: {
            fontSize: 20,
            color: '#333333',
            textAlign: 'left',
          },
        },
      ],
    }],
  },
  {
    id: 'scripture-verse',
    name: 'Scripture Verse',
    description: 'Beautiful scripture verse display',
    category: 'sermon',
    icon: <BookOpen className="w-5 h-5" />,
    frames: [{
      title: 'Scripture',
      width: 640,
      height: 360,
      backgroundColor: '#f5f5f5',
      elements: [
        {
          type: 'text',
          content: 'John 3:16',
          position: { x: 50, y: 30 },
          size: { width: 540, height: 40 },
          style: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#8b4513',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 200 },
          style: {
            fontSize: 24,
            color: '#1a1a2e',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'General announcement slide',
    category: 'announcement',
    icon: <Megaphone className="w-5 h-5" />,
    frames: [{
      title: 'Announcement',
      width: 640,
      height: 360,
      backgroundColor: '#3b82f6',
      elements: [
        {
          type: 'text',
          content: 'ANNOUNCEMENT',
          position: { x: 50, y: 50 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Your announcement text here...',
          position: { x: 50, y: 130 },
          size: { width: 540, height: 180 },
          style: {
            fontSize: 22,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'worship-lyrics',
    name: 'Worship Lyrics',
    description: 'Slide for displaying worship song lyrics',
    category: 'worship',
    icon: <Music className="w-5 h-5" />,
    frames: [{
      title: 'Worship Song',
      width: 640,
      height: 360,
      backgroundColor: '#1a1a2e',
      elements: [
        {
          type: 'text',
          content: 'Song Title',
          position: { x: 50, y: 30 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Verse 1\n\nLine 1\nLine 2\nLine 3',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 220 },
          style: {
            fontSize: 24,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'service-order',
    name: 'Service Order',
    description: 'Order of service slide',
    category: 'service',
    icon: <Calendar className="w-5 h-5" />,
    frames: [{
      title: 'Order of Service',
      width: 640,
      height: 360,
      backgroundColor: '#ffffff',
      elements: [
        {
          type: 'text',
          content: 'Order of Service',
          position: { x: 50, y: 30 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#1a1a2e',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: '1. Welcome\n2. Worship\n3. Message\n4. Offering\n5. Benediction',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 220 },
          style: {
            fontSize: 22,
            color: '#333333',
            textAlign: 'left',
          },
        },
      ],
    }],
  },
  {
    id: 'prayer-request',
    name: 'Prayer Request',
    description: 'Slide for displaying prayer requests',
    category: 'prayer',
    icon: <Heart className="w-5 h-5" />,
    frames: [{
      title: 'Prayer Request',
      width: 640,
      height: 360,
      backgroundColor: '#fef3c7',
      elements: [
        {
          type: 'text',
          content: 'Prayer Request',
          position: { x: 50, y: 30 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#92400e',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Please pray for...',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 220 },
          style: {
            fontSize: 22,
            color: '#78350f',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'welcome',
    name: 'Welcome Slide',
    description: 'Welcome slide for services',
    category: 'service',
    icon: <Users className="w-5 h-5" />,
    frames: [{
      title: 'Welcome',
      width: 640,
      height: 360,
      backgroundColor: '#10b981',
      elements: [
        {
          type: 'text',
          content: 'Welcome',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 80 },
          style: {
            fontSize: 56,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'We\'re glad you\'re here!',
          position: { x: 50, y: 220 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 24,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'offering',
    name: 'Offering Slide',
    description: 'Slide for offering time',
    category: 'service',
    icon: <Heart className="w-5 h-5" />,
    frames: [{
      title: 'Offering',
      width: 640,
      height: 360,
      backgroundColor: '#1e40af',
      elements: [
        {
          type: 'text',
          content: 'Offering',
          position: { x: 50, y: 80 },
          size: { width: 540, height: 60 },
          style: {
            fontSize: 42,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.',
          position: { x: 50, y: 160 },
          size: { width: 540, height: 120 },
          style: {
            fontSize: 18,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Luke 6:38',
          position: { x: 50, y: 300 },
          size: { width: 540, height: 30 },
          style: {
            fontSize: 16,
            color: '#cbd5e1',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'benediction',
    name: 'Benediction',
    description: 'Closing benediction slide',
    category: 'service',
    icon: <Sparkles className="w-5 h-5" />,
    frames: [{
      title: 'Benediction',
      width: 640,
      height: 360,
      backgroundColor: '#1a1a2e',
      elements: [
        {
          type: 'text',
          content: 'Benediction',
          position: { x: 50, y: 50 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.',
          position: { x: 50, y: 120 },
          size: { width: 540, height: 180 },
          style: {
            fontSize: 22,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Numbers 6:24-26',
          position: { x: 50, y: 310 },
          size: { width: 540, height: 30 },
          style: {
            fontSize: 16,
            color: '#a0a0a0',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'event-announcement',
    name: 'Event Announcement',
    description: 'Announce upcoming events',
    category: 'announcement',
    icon: <Calendar className="w-5 h-5" />,
    frames: [{
      title: 'Upcoming Event',
      width: 640,
      height: 360,
      backgroundColor: '#7c3aed',
      elements: [
        {
          type: 'text',
          content: 'UPCOMING EVENT',
          position: { x: 50, y: 40 },
          size: { width: 540, height: 40 },
          style: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Event Name',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Date: [Date]\nTime: [Time]\nLocation: [Location]',
          position: { x: 50, y: 170 },
          size: { width: 540, height: 150 },
          style: {
            fontSize: 20,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'worship-set',
    name: 'Worship Set List',
    description: 'List of songs for worship',
    category: 'worship',
    icon: <Music className="w-5 h-5" />,
    frames: [{
      title: 'Worship Set',
      width: 640,
      height: 360,
      backgroundColor: '#0f172a',
      elements: [
        {
          type: 'text',
          content: 'Worship Set',
          position: { x: 50, y: 30 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: '1. Song Title 1\n2. Song Title 2\n3. Song Title 3\n4. Song Title 4',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 220 },
          style: {
            fontSize: 24,
            color: '#ffffff',
            textAlign: 'left',
          },
        },
      ],
    }],
  },
  {
    id: 'testimony',
    name: 'Testimony Slide',
    description: 'Slide for sharing testimonies',
    category: 'other',
    icon: <Heart className="w-5 h-5" />,
    frames: [{
      title: 'Testimony',
      width: 640,
      height: 360,
      backgroundColor: '#fef3c7',
      elements: [
        {
          type: 'text',
          content: 'Testimony',
          position: { x: 50, y: 30 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#92400e',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Share what God has done in your life...',
          position: { x: 50, y: 100 },
          size: { width: 540, height: 220 },
          style: {
            fontSize: 20,
            color: '#78350f',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
  {
    id: 'sermon-series',
    name: 'Sermon Series Title',
    description: 'Title slide for sermon series',
    category: 'sermon',
    icon: <BookOpen className="w-5 h-5" />,
    frames: [{
      title: 'Sermon Series',
      width: 640,
      height: 360,
      backgroundColor: '#1e293b',
      elements: [
        {
          type: 'text',
          content: 'SERIES TITLE',
          position: { x: 50, y: 80 },
          size: { width: 540, height: 60 },
          style: {
            fontSize: 40,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Week 1',
          position: { x: 50, y: 160 },
          size: { width: 540, height: 40 },
          style: {
            fontSize: 24,
            color: '#94a3b8',
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          content: 'Sermon Title',
          position: { x: 50, y: 220 },
          size: { width: 540, height: 50 },
          style: {
            fontSize: 28,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
    }],
  },
];

interface TemplatesLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatesLibrary({ open, onOpenChange }: TemplatesLibraryProps) {
  const { addFrame, addElement, canvas, zoom, panX, panY } = usePresentationEditorStore();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleApplyTemplate = (template: Template) => {
    const centerX = canvas ? (canvas.getWidth() / 2 - panX) / zoom : 500;
    const centerY = canvas ? (canvas.getHeight() / 2 - panY) / zoom : 500;

    template.frames.forEach((frameTemplate, index) => {
      const frameId = addFrame({
        title: frameTemplate.title,
        position: {
          x: centerX - frameTemplate.width / 2 + (index * 50),
          y: centerY - frameTemplate.height / 2 + (index * 50),
        },
        scale: 1,
        rotation: 0,
        width: frameTemplate.width,
        height: frameTemplate.height,
        backgroundColor: frameTemplate.backgroundColor,
        borderColor: '#e5e7eb',
      });

      // Add elements after a short delay to ensure frame is rendered
      setTimeout(() => {
        frameTemplate.elements.forEach((element) => {
          addElement(frameId, {
            type: element.type,
            content: element.content,
            position: element.position,
            size: element.size,
            rotation: 0,
            style: element.style,
          });
        });
      }, 100);
    });

    toast({
      title: "Template Applied",
      description: `${template.name} has been added to your presentation`,
    });
    onOpenChange(false);
  };

  const categories = [
    { id: 'all', label: 'All Templates', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'sermon', label: 'Sermon', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'announcement', label: 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'worship', label: 'Worship', icon: <Music className="w-4 h-4" /> },
    { id: 'service', label: 'Service', icon: <Calendar className="w-4 h-4" /> },
    { id: 'prayer', label: 'Prayer', icon: <Heart className="w-4 h-4" /> },
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Presentation Templates
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose from pre-designed templates for sermons, announcements, worship, and more
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex items-center gap-2 data-[state=active]:bg-blue-600"
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer group"
                  onClick={() => handleApplyTemplate(template)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400 group-hover:bg-blue-600/30 transition-colors">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-400">{template.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30"
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

