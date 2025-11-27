"use client";

import { useState } from "react";
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
import { 
  Users, 
  Filter, 
  Plus, 
  X,
  Save,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMarketingStore } from "@/lib/store/marketing-store";

interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: {
    field: string;
    operator: string;
    value: string;
  }[];
  memberCount: number;
}

interface AudienceSegmentationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const segmentFields = [
  { id: 'age', label: 'Age', type: 'number' },
  { id: 'location', label: 'Location', type: 'text' },
  { id: 'attendance', label: 'Attendance Frequency', type: 'select', options: ['Weekly', 'Monthly', 'Occasional', 'Rare'] },
  { id: 'giving', label: 'Giving Status', type: 'select', options: ['Regular', 'Occasional', 'None'] },
  { id: 'groups', label: 'Group Membership', type: 'text' },
  { id: 'membership', label: 'Membership Status', type: 'select', options: ['Member', 'Visitor', 'Regular Attender'] },
];

const operators = [
  { id: 'equals', label: 'Equals' },
  { id: 'contains', label: 'Contains' },
  { id: 'greater-than', label: 'Greater Than' },
  { id: 'less-than', label: 'Less Than' },
  { id: 'in', label: 'In' },
];

export function AudienceSegmentation({ open, onOpenChange }: AudienceSegmentationProps) {
  const { toast } = useToast();
  const { segments, addSegment, updateSegment, deleteSegment } = useMarketingStore();
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [criteria, setCriteria] = useState<Array<{ field: string; operator: string; value: string }>>([
    { field: '', operator: 'equals', value: '' }
  ]);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { field: '', operator: 'equals', value: '' }]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleUpdateCriterion = (index: number, updates: Partial<{ field: string; operator: string; value: string }>) => {
    setCriteria(criteria.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const handleCreateSegment = () => {
    if (!segmentName || criteria.some(c => !c.field || !c.value)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const segmentId = addSegment({
      name: segmentName,
      description: segmentDescription,
      criteria: criteria.map(c => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
    });

    toast({
      title: "Segment Created",
      description: `${segmentName} segment created. Calculating member count...`,
    });

    // Reset form
    setSegmentName("");
    setSegmentDescription("");
    setCriteria([{ field: '', operator: 'equals', value: '' }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Audience Segmentation
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create targeted audience segments for personalized marketing
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="segments" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="segments">My Segments</TabsTrigger>
            <TabsTrigger value="create">Create Segment</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {segments.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No segments created yet</p>
                  <p className="text-xs mt-2">Create segments to target specific audiences</p>
                </div>
              ) : (
                <div className="space-y-3 p-2">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white">{segment.name}</h3>
                            <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                              {segment.memberCount} members
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{segment.description}</p>
                          <div className="space-y-1">
                            {segment.criteria.map((criterion, idx) => {
                              const field = segmentFields.find(f => f.id === criterion.field);
                              return (
                                <div key={idx} className="text-xs text-gray-500">
                                  {field?.label} {criterion.operator} {criterion.value}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-2">
                <div>
                  <Label htmlFor="segment-name" className="text-sm font-medium text-gray-300 mb-2 block">
                    Segment Name
                  </Label>
                  <Input
                    id="segment-name"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="e.g., Active Members, New Visitors"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="segment-description" className="text-sm font-medium text-gray-300 mb-2 block">
                    Description
                  </Label>
                  <Input
                    id="segment-description"
                    value={segmentDescription}
                    onChange={(e) => setSegmentDescription(e.target.value)}
                    placeholder="Describe this segment"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-300">Criteria</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCriterion}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Criterion
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {criteria.map((criterion, index) => {
                      const field = segmentFields.find(f => f.id === criterion.field);
                      return (
                        <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-400">Criterion {index + 1}</span>
                            {criteria.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCriterion(index)}
                                className="ml-auto text-red-400 hover:text-red-300 h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={criterion.field}
                              onChange={(e) => handleUpdateCriterion(index, { field: e.target.value })}
                              className="bg-gray-700 border-gray-600 text-white text-sm rounded px-2 py-1"
                            >
                              <option value="">Select field</option>
                              {segmentFields.map(field => (
                                <option key={field.id} value={field.id}>{field.label}</option>
                              ))}
                            </select>
                            <select
                              value={criterion.operator}
                              onChange={(e) => handleUpdateCriterion(index, { operator: e.target.value })}
                              className="bg-gray-700 border-gray-600 text-white text-sm rounded px-2 py-1"
                            >
                              {operators.map(op => (
                                <option key={op.id} value={op.id}>{op.label}</option>
                              ))}
                            </select>
                            {field?.type === 'select' ? (
                              <select
                                value={criterion.value}
                                onChange={(e) => handleUpdateCriterion(index, { value: e.target.value })}
                                className="bg-gray-700 border-gray-600 text-white text-sm rounded px-2 py-1"
                              >
                                <option value="">Select value</option>
                                {field.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                value={criterion.value}
                                onChange={(e) => handleUpdateCriterion(index, { value: e.target.value })}
                                placeholder="Value"
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSegment}
                disabled={!segmentName || criteria.some(c => !c.field || !c.value)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Segment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

