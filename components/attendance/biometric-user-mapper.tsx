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
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PremiumBadge } from "@/components/premium/premium-badge";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  biometricUserId: string | null;
  role: string;
}

interface BiometricDevice {
  id: string;
  name: string;
  serviceTagId: string;
}

export function BiometricUserMapper() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [biometricUserId, setBiometricUserId] = useState("");
  const [showMapDialog, setShowMapDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDevices();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users?includeBiometric=true&limit=1000");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
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
    }
  };

  const handleMapUser = async () => {
    if (!selectedUser || !biometricUserId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a user and enter a biometric user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/users/" + selectedUser.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biometricUserId: biometricUserId.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "User Mapped",
          description: `${selectedUser.firstName} ${selectedUser.lastName} has been linked to biometric ID ${biometricUserId}`,
        });
        setShowMapDialog(false);
        setSelectedUser(null);
        setBiometricUserId("");
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to map user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to map user",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMapping = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this biometric mapping?")) return;

    try {
      const response = await fetch("/api/users/" + userId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biometricUserId: null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Mapping Removed",
          description: "Biometric mapping has been removed",
        });
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove mapping",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.biometricUserId?.includes(searchQuery)
  );

  const mappedUsers = filteredUsers.filter((u) => u.biometricUserId);
  const unmappedUsers = filteredUsers.filter((u) => !u.biometricUserId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-950">
        <div className="text-gray-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-950 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Link Users to Biometric Devices
            <PremiumBadge size="sm" />
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Map church members to their biometric user IDs from the device
          </p>
        </div>
        <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Map User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Map User to Biometric ID</DialogTitle>
              <DialogDescription className="text-gray-400">
                Link a user to their biometric user ID from the device
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">Select User</Label>
                <ScrollArea className="h-48 border border-gray-700 rounded-lg mt-2">
                  <div className="p-2 space-y-1">
                    {unmappedUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-2 rounded cursor-pointer hover:bg-gray-800 ${
                          selectedUser?.id === user.id ? "bg-blue-600/20 border border-blue-500" : ""
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="text-sm font-medium text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.email || user.phone || "No contact"}
                        </div>
                      </div>
                    ))}
                    {unmappedUsers.length === 0 && (
                      <div className="text-center text-gray-500 py-8 text-sm">
                        All users are mapped
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <Label className="text-gray-300">Biometric User ID *</Label>
                <Input
                  value={biometricUserId}
                  onChange={(e) => setBiometricUserId(e.target.value)}
                  placeholder="Enter user ID from device (e.g., 1, 2, 100)"
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the User ID assigned in the biometric device
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMapDialog(false);
                    setSelectedUser(null);
                    setBiometricUserId("");
                  }}
                  className="border-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMapUser}
                  disabled={!selectedUser || !biometricUserId.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Map User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, phone, or biometric ID..."
          className="pl-10 bg-gray-800 border-gray-700 text-white"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-white">{users.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Mapped Users</div>
          <div className="text-2xl font-bold text-green-400">{mappedUsers.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Unmapped Users</div>
          <div className="text-2xl font-bold text-yellow-400">{unmappedUsers.length}</div>
        </div>
      </div>

      {/* Mapped Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Mapped Users ({mappedUsers.length})
          </h3>
        </div>
        {mappedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Fingerprint className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No users mapped yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Start mapping users to enable biometric attendance
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-800/50">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Contact</TableHead>
                <TableHead className="text-gray-300">Biometric ID</TableHead>
                <TableHead className="text-gray-300">Role</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-gray-800 hover:bg-gray-800/50"
                >
                  <TableCell className="text-white font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {user.email || user.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 font-mono">
                      {user.biometricUserId}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 capitalize">
                    {user.role.toLowerCase()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMapping(user.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">
          How to Link Users to Biometric Devices
        </h3>
        <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
          <li>
            <strong>Add users to the biometric device</strong> using the device's admin panel or
            Cams API Monitor
          </li>
          <li>
            <strong>Note the User ID</strong> assigned to each user in the device (e.g., 1, 2, 100)
          </li>
          <li>
            <strong>Map users here</strong> by selecting a user and entering their biometric User ID
          </li>
          <li>
            <strong>Test the connection</strong> by having a user mark attendance on the device
          </li>
          <li>
            <strong>Verify attendance</strong> appears in the attendance records
          </li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          <strong>Note:</strong> The biometric User ID must match exactly what is stored in the
          device. You can find this in the Cams API Monitor or device admin panel.
        </p>
      </div>
    </div>
  );
}

