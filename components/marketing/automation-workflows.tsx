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
  Workflow, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Settings,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action';
  action: 'send-email' | 'send-sms' | 'add-to-group' | 'create-event' | 'post-social';
  config: Record<string, any>;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'draft';
  createdAt: Date;
}

interface AutomationWorkflowsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const workflowTemplates = [
  {
    id: 'new-member-welcome',
    name: 'New Member Welcome',
    description: 'Automatically welcome new members with email and add to groups',
    trigger: 'member-joined',
    steps: [
      { type: 'action', action: 'send-email', config: { template: 'welcome-email' } },
      { type: 'action', action: 'add-to-group', config: { group: 'new-members' } },
    ],
  },
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    description: 'Send reminders before events',
    trigger: 'event-approaching',
    steps: [
      { type: 'action', action: 'send-email', config: { template: 'event-reminder', daysBefore: 1 } },
      { type: 'action', action: 'send-sms', config: { template: 'event-reminder-sms', hoursBefore: 2 } },
    ],
  },
  {
    id: 'donation-thank-you',
    name: 'Donation Thank You',
    description: 'Automatically thank donors',
    trigger: 'donation-received',
    steps: [
      { type: 'action', action: 'send-email', config: { template: 'donation-thank-you' } },
      { type: 'action', action: 'post-social', config: { platform: 'facebook', template: 'donation-update' } },
    ],
  },
];

export function AutomationWorkflows({ open, onOpenChange }: AutomationWorkflowsProps) {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleCreateFromTemplate = (template: typeof workflowTemplates[0]) => {
    const newWorkflow: AutomationWorkflow = {
      id: `workflow_${Date.now()}`,
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      steps: template.steps as WorkflowStep[],
      status: 'draft',
      createdAt: new Date(),
    };

    setWorkflows([...workflows, newWorkflow]);
    toast({
      title: "Workflow Created",
      description: `${template.name} workflow has been created`,
    });
  };

  const handleToggleStatus = (workflowId: string) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId 
        ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
        : w
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Marketing Automation
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create automated workflows for marketing and engagement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Templates */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-3 block">Workflow Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {workflowTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors cursor-pointer"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                      <Workflow className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.steps.map((step, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-gray-700/50 text-gray-300">
                            {step.action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFromTemplate(template);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Workflows */}
          <div className="flex-1 overflow-hidden flex flex-col border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-300">Active Workflows</Label>
              <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                {workflows.filter(w => w.status === 'active').length} Active
              </Badge>
            </div>
            <ScrollArea className="flex-1 border border-gray-700 rounded-lg">
              {workflows.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Workflow className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p>No workflows yet</p>
                  <p className="text-xs mt-2">Use a template above to get started</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white">{workflow.name}</h3>
                            <Badge
                              variant="outline"
                              className={
                                workflow.status === 'active'
                                  ? 'bg-green-600/20 text-green-400 border-green-500/30'
                                  : workflow.status === 'paused'
                                  ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-gray-600/20 text-gray-400 border-gray-500/30'
                              }
                            >
                              {workflow.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{workflow.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {workflow.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                              >
                                {step.action === 'send-email' && <Mail className="w-3 h-3" />}
                                {step.action === 'send-sms' && <MessageSquare className="w-3 h-3" />}
                                {step.action === 'add-to-group' && <Users className="w-3 h-3" />}
                                {step.action === 'create-event' && <Calendar className="w-3 h-3" />}
                                <span>{step.action.replace('-', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(workflow.id)}
                            className={`text-xs ${
                              workflow.status === 'active'
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-green-400 hover:text-green-300'
                            }`}
                          >
                            {workflow.status === 'active' ? (
                              <>
                                <Pause className="w-3 h-3 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

