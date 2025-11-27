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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Fingerprint,
  Plus,
  Settings,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumBadge } from "@/components/premium/premium-badge";
import { UpgradeDialog } from "@/components/premium/upgrade-dialog";
import { PremiumFeature } from "@/lib/utils/premium-features";

interface BiometricDevice {
  id: string;
  name: string;
  serviceTagId: string;
  deviceModel: string;
  location: string;
  authToken: string;
  callbackUrl: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    attendanceRecords: number;
  };
}

export function BiometricDeviceManager() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BiometricDevice | null>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [serviceTagId, setServiceTagId] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [location, setLocation] = useState("");
  const [authToken, setAuthToken] = useState("");

  useEffect(() => {
    checkPremiumAccess();
    fetchDevices();
  }, []);

  const checkPremiumAccess = async () => {
    try {
      const response = await fetch(
        `/api/subscription/features?feature=${PremiumFeature.BIOMETRIC_ATTENDANCE}`
      );
      if (response.ok) {
        const data = await response.json();
        setHasPremiumAccess(data.hasAccess || false);
      }
    } catch (error) {
      console.error("Error checking premium access:", error);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/biometric/devices");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!hasPremiumAccess) {
      setShowUpgradeDialog(true);
      return;
    }

    if (!name || !serviceTagId || !authToken) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/biometric/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          serviceTagId,
          deviceModel,
          location,
          authToken,
        }),
      });

      if (response.ok) {
        toast({
          title: "Device Added",
          description: "Biometric device has been added successfully",
        });
        setShowAddDialog(false);
        resetForm();
        fetchDevices();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add device",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to delete this device?")) return;

    try {
      const response = await fetch(`/api/biometric/devices/${deviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Device Deleted",
          description: "Device has been removed",
        });
        fetchDevices();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    }
  };

  const copyCallbackUrl = (device: BiometricDevice) => {
    navigator.clipboard.writeText(device.callbackUrl);
    toast({
      title: "Copied",
      description: "Callback URL copied to clipboard",
    });
  };

  const resetForm = () => {
    setName("");
    setServiceTagId("");
    setDeviceModel("");
    setLocation("");
    setAuthToken("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-950">
        <div className="text-gray-400">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-950 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Fingerprint className="w-6 h-6" />
            Biometric Devices
            <PremiumBadge size="sm" />
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage fingerprint attendance devices
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Add Biometric Device</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure a new Cams Biometrics device
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">Device Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Main Entrance Device"
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Service Tag ID (STGID) *</Label>
                <Input
                  value={serviceTagId}
                  onChange={(e) => setServiceTagId(e.target.value)}
                  placeholder="Device service tag ID"
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found in Cams API Monitor
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Device Model</Label>
                <Input
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="e.g., Cams X1, ZKTeco F18"
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Main Entrance, Office"
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Auth Token *</Label>
                <Input
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Authentication token from API Monitor"
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Configured in Cams API Monitor for this device
                </p>
              </div>
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-400">
                  <strong>Note:</strong> After adding the device, configure the Callback URL in Cams API Monitor:
                  <br />
                  <code className="text-xs mt-1 block bg-gray-800/50 border border-gray-700 rounded px-2 py-1 text-blue-300 font-mono break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/api/biometric/callback?stgid=${serviceTagId || "YOUR_STGID"}`
                      : "/api/biometric/callback?stgid=YOUR_STGID"}
                  </code>
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                  className="border-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDevice}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Device
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg">
          <Fingerprint className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No biometric devices configured</p>
          <p className="text-sm text-gray-500 mt-2">
            Add your first device to start receiving attendance data
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-800/50">
                <TableHead className="text-gray-300">Device Name</TableHead>
                <TableHead className="text-gray-300">Service Tag ID</TableHead>
                <TableHead className="text-gray-300">Model</TableHead>
                <TableHead className="text-gray-300">Location</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Records</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow
                  key={device.id}
                  className="border-gray-800 hover:bg-gray-800/50"
                >
                  <TableCell className="text-white font-medium">
                    {device.name}
                  </TableCell>
                  <TableCell className="text-gray-400 font-mono text-xs">
                    {device.serviceTagId}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {device.deviceModel}
                  </TableCell>
                  <TableCell className="text-gray-400">{device.location}</TableCell>
                  <TableCell>
                    {device.isActive ? (
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {device._count?.attendanceRecords || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCallbackUrl(device)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDevice(device.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">
          Complete Setup Instructions
        </h3>
        <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
          <li>
            <strong>Add your device</strong> using the form above with Service Tag ID and Auth Token
          </li>
          <li>
            <strong>Log in to Cams API Monitor</strong> (
            <a
              href="https://camsbiometrics.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              camsbiometrics.com
            </a>
            )
          </li>
          <li>
            <strong>Configure Callback URL:</strong> Copy the callback URL shown above and paste it
            in API Monitor for this device
          </li>
          <li>
            <strong>Set Auth Token:</strong> Ensure the Auth Token in API Monitor matches the one
            you entered
          </li>
          <li>
            <strong>Link Users:</strong> Go to the "Link Users" tab to map church members to their
            biometric User IDs
          </li>
          <li>
            <strong>Test:</strong> Have a user mark attendance on the device and verify it appears
            in the system
          </li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          For more information, visit{" "}
          <a
            href="https://camsbiometrics.com/application/biometric-web-api.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Cams Biometrics API Documentation
          </a>
        </p>
      </div>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature={PremiumFeature.BIOMETRIC_ATTENDANCE}
      />
    </div>
  );
}

