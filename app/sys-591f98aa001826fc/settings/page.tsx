"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Settings, Plus, Loader2, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  label: string;
  description: string | null;
  isPublic: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    key: "",
    value: "",
    type: "STRING",
    category: "general",
    label: "",
    description: "",
    isPublic: false,
    isEditable: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId
        ? `/api/admin/settings/${editingId}`
        : "/api/admin/settings";
      
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save setting");
      }

      toast({
        title: "Success",
        description: `Setting ${editingId ? "updated" : "created"} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (setting: SystemSetting) => {
    if (!setting.isEditable) {
      toast({
        title: "Warning",
        description: "This setting is not editable",
        variant: "destructive",
      });
      return;
    }
    
    setEditingId(setting.id);
    setFormData({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      category: setting.category,
      label: setting.label,
      description: setting.description || "",
      isPublic: setting.isPublic,
      isEditable: setting.isEditable,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      key: "",
      value: "",
      type: "STRING",
      category: "general",
      label: "",
      description: "",
      isPublic: false,
      isEditable: true,
    });
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            System Settings
          </h1>
          <p className="text-gray-500 mt-1">
            Global configuration and feature flags
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Setting" : "Add New Setting"}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update system setting"
                    : "Create a new system-wide setting"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Key *</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    required
                    disabled={!!editingId}
                    placeholder="e.g., max_churches_per_month"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    required
                    placeholder="Display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    required
                    placeholder="Setting value"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STRING">String</SelectItem>
                        <SelectItem value="NUMBER">Number</SelectItem>
                        <SelectItem value="BOOLEAN">Boolean</SelectItem>
                        <SelectItem value="JSON">JSON</SelectItem>
                        <SelectItem value="ARRAY">Array</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="features">Features</SelectItem>
                        <SelectItem value="limits">Limits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Help text for this setting"
                    rows={3}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Public Setting</Label>
                      <p className="text-sm text-gray-500">
                        Visible to church admins
                      </p>
                    </div>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isPublic: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Editable</Label>
                      <p className="text-sm text-gray-500">
                        Can be modified via UI
                      </p>
                    </div>
                    <Switch
                      checked={formData.isEditable}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isEditable: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? "Update" : "Create"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Settings by Category */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category} Settings</CardTitle>
              <CardDescription>
                {categorySettings.length} setting{categorySettings.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setting</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorySettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{setting.label}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {setting.key}
                          </p>
                          {setting.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {setting.value}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{setting.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {setting.isPublic && (
                            <Badge variant="secondary">Public</Badge>
                          )}
                          {!setting.isEditable && (
                            <Badge variant="secondary">Read-only</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(setting)}
                          disabled={!setting.isEditable}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {Object.keys(groupedSettings).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No system settings configured. Add your first setting to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
