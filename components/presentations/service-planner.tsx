"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Music, BookOpen, Users, Heart, Plus, X } from "lucide-react";
import { usePresentationEditorStore } from "@/lib/store/presentation-editor-store";
import { useToast } from "@/hooks/use-toast";

interface ServiceItem {
  id: string;
  type: 'welcome' | 'worship' | 'scripture' | 'sermon' | 'offering' | 'announcement' | 'prayer' | 'benediction';
  title: string;
  duration?: number; // minutes
  notes?: string;
}

interface ServicePlannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const serviceItemTypes = [
  { id: 'welcome', label: 'Welcome', icon: <Users className="w-4 h-4" />, defaultDuration: 2 },
  { id: 'worship', label: 'Worship', icon: <Music className="w-4 h-4" />, defaultDuration: 15 },
  { id: 'scripture', label: 'Scripture Reading', icon: <BookOpen className="w-4 h-4" />, defaultDuration: 3 },
  { id: 'sermon', label: 'Sermon', icon: <BookOpen className="w-4 h-4" />, defaultDuration: 30 },
  { id: 'offering', label: 'Offering', icon: <Heart className="w-4 h-4" />, defaultDuration: 5 },
  { id: 'announcement', label: 'Announcements', icon: <Users className="w-4 h-4" />, defaultDuration: 5 },
  { id: 'prayer', label: 'Prayer', icon: <Heart className="w-4 h-4" />, defaultDuration: 3 },
  { id: 'benediction', label: 'Benediction', icon: <Heart className="w-4 h-4" />, defaultDuration: 2 },
];

export function ServicePlanner({ open, onOpenChange }: ServicePlannerProps) {
  const { addFrame, addElement, canvas, zoom, panX, panY } = usePresentationEditorStore();
  const { toast } = useToast();
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceTime, setServiceTime] = useState('10:00');

  const handleAddItem = (type: ServiceItem['type']) => {
    const typeConfig = serviceItemTypes.find(t => t.id === type);
    const newItem: ServiceItem = {
      id: `item_${Date.now()}`,
      type,
      title: typeConfig?.label || type,
      duration: typeConfig?.defaultDuration || 5,
    };
    setServiceItems([...serviceItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setServiceItems(serviceItems.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<ServiceItem>) => {
    setServiceItems(serviceItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleGenerateSlides = () => {
    if (serviceItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to your service plan",
        variant: "destructive",
      });
      return;
    }

    const centerX = canvas ? (canvas.getWidth() / 2 - panX) / zoom : 500;
    const centerY = canvas ? (canvas.getHeight() / 2 - panY) / zoom : 500;
    let offsetY = centerY - (serviceItems.length * 200) / 2;

    serviceItems.forEach((item, index) => {
      const frameId = addFrame({
        title: item.title,
        position: {
          x: centerX - 320,
          y: offsetY + (index * 200),
        },
        scale: 1,
        rotation: 0,
        width: 640,
        height: 360,
        backgroundColor: getBackgroundColorForType(item.type),
        borderColor: '#e5e7eb',
      });

      setTimeout(() => {
        // Add title
        addElement(frameId, {
          type: 'text',
          content: item.title.toUpperCase(),
          position: { x: 50, y: 50 },
          size: { width: 540, height: 50 },
          rotation: 0,
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        });

        // Add duration if specified
        if (item.duration) {
          addElement(frameId, {
            type: 'text',
            content: `${item.duration} minutes`,
            position: { x: 50, y: 120 },
            size: { width: 540, height: 30 },
            rotation: 0,
            style: {
              fontSize: 18,
              color: '#e0e0e0',
              textAlign: 'center',
            },
          });
        }

        // Add notes if provided
        if (item.notes) {
          addElement(frameId, {
            type: 'text',
            content: item.notes,
            position: { x: 50, y: 170 },
            size: { width: 540, height: 150 },
            rotation: 0,
            style: {
              fontSize: 20,
              color: '#ffffff',
              textAlign: 'center',
            },
          });
        }
      }, 100 * (index + 1));
    });

    toast({
      title: "Service Plan Generated",
      description: `Created ${serviceItems.length} slides from your service plan`,
    });
    onOpenChange(false);
  };

  const getBackgroundColorForType = (type: ServiceItem['type']): string => {
    const colors: Record<ServiceItem['type'], string> = {
      welcome: '#10b981',
      worship: '#8b5cf6',
      scripture: '#3b82f6',
      sermon: '#1e293b',
      offering: '#1e40af',
      announcement: '#7c3aed',
      prayer: '#f59e0b',
      benediction: '#1a1a2e',
    };
    return colors[type] || '#ffffff';
  };

  const totalDuration = serviceItems.reduce((sum, item) => sum + (item.duration || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Service Planner
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Plan your service and generate slides automatically
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Service Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Service Date</Label>
              <Input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Service Time</Label>
              <Input
                type="time"
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Add Items */}
          <div>
            <Label className="text-sm text-gray-300 mb-2 block">Add Service Items</Label>
            <div className="flex flex-wrap gap-2">
              {serviceItemTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddItem(type.id as ServiceItem['type'])}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {type.icon}
                  <span className="ml-2">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Service Items List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-gray-300">Service Order</Label>
              <div className="text-sm text-gray-400">
                Total Duration: <span className="font-semibold text-white">{totalDuration} minutes</span>
              </div>
            </div>
            <ScrollArea className="flex-1 border border-gray-700 rounded-lg p-4">
              {serviceItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No items added yet. Click buttons above to add service items.
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceItems.map((item, index) => {
                    const typeConfig = serviceItemTypes.find(t => t.id === item.type);
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {typeConfig?.icon}
                              <Input
                                value={item.title}
                                onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                                className="flex-1 bg-gray-700 border-gray-600 text-white"
                                placeholder="Item title"
                              />
                              <Input
                                type="number"
                                value={item.duration}
                                onChange={(e) => handleUpdateItem(item.id, { duration: parseInt(e.target.value) || 0 })}
                                className="w-24 bg-gray-700 border-gray-600 text-white"
                                placeholder="Min"
                              />
                              <span className="text-sm text-gray-400">min</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <Input
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                              className="bg-gray-700 border-gray-600 text-white text-sm"
                              placeholder="Notes (optional)"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateSlides}
            disabled={serviceItems.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Slides
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

