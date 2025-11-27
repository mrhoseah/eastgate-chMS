"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AttendanceCapture } from "@/components/attendance/attendance-capture";
import { BiometricDeviceManager } from "@/components/attendance/biometric-device-manager";
import { BiometricUserMapper } from "@/components/attendance/biometric-user-mapper";
import { PremiumBadge } from "@/components/premium/premium-badge";
import {
  Calendar,
  Users,
  Loader2,
  Plus,
  Clock,
  MapPin,
  Building,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MasterEvent {
  id: string;
  name: string;
  type: "SERVICE" | "GROUP" | "EVENT" | "MEETING" | "FELLOWSHIP" | "TRAINING" | "OUTREACH" | "OTHER";
  description: string | null;
  campus: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
  defaultStartTime: string | null;
  defaultDuration: number | null;
  isRecurring: boolean;
}

interface AttendanceSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  name: string | null;
  location: string | null;
  isJointService: boolean;
  masterEvent: {
    id: string;
    name: string;
    type: string;
    campus: { id: string; name: string } | null;
  };
  _count: {
    attendees: number;
    decisions: number;
  };
}

export default function AttendancePage() {
  const [masterEvents, setMasterEvents] = useState<MasterEvent[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [selectedMasterEventId, setSelectedMasterEventId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [masterEventDialogOpen, setMasterEventDialogOpen] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    name: "",
    location: "",
    isJointService: false,
  });
  const [masterEventFormData, setMasterEventFormData] = useState({
    name: "",
    type: "SERVICE" as const,
    description: "",
    campusId: "",
    defaultStartTime: "",
    defaultDuration: "",
    isRecurring: true,
  });

  useEffect(() => {
    fetchMasterEvents();
  }, []);

  useEffect(() => {
    if (selectedMasterEventId) {
      fetchAttendanceSessions();
    }
  }, [selectedMasterEventId]);

  const fetchMasterEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/master-events?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setMasterEvents(data.masterEvents || []);
        if (data.masterEvents && data.masterEvents.length > 0) {
          setSelectedMasterEventId(data.masterEvents[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching master events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSessions = async () => {
    if (!selectedMasterEventId) return;
    
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const response = await fetch(
        `/api/attendance-sessions?masterEventId=${selectedMasterEventId}&startDate=${today.toISOString()}&endDate=${nextWeek.toISOString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSessionId(data.sessions[0].id);
        } else {
          setSelectedSessionId("");
        }
      }
    } catch (error) {
      console.error("Error fetching attendance sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedMasterEventId) {
      alert("Please select a master event first");
      return;
    }

    try {
      const selectedMasterEvent = masterEvents.find((e) => e.id === selectedMasterEventId);
      const defaultStartTime = selectedMasterEvent?.defaultStartTime || "09:00";
      
      // Combine date and time
      const startDateTime = new Date(`${sessionFormData.date}T${sessionFormData.startTime || defaultStartTime}`);
      const endDateTime = sessionFormData.endTime 
        ? new Date(`${sessionFormData.date}T${sessionFormData.endTime}`)
        : null;

      const response = await fetch("/api/attendance-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterEventId: selectedMasterEventId,
          date: sessionFormData.date,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime?.toISOString() || null,
          name: sessionFormData.name || null,
          location: sessionFormData.location || null,
          isJointService: sessionFormData.isJointService,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionDialogOpen(false);
        setSessionFormData({
          date: format(new Date(), "yyyy-MM-dd"),
          startTime: "",
          endTime: "",
          name: "",
          location: "",
          isJointService: false,
        });
        fetchAttendanceSessions();
        // Auto-select the newly created session
        if (data.id) {
          setSelectedSessionId(data.id);
        }
        alert("Attendance session created successfully! QR codes for giving are being generated in the background.");
      } else {
        const data = await response.json();
        const errorMessage = data.error || "Failed to create session";
        console.error("Session creation error:", errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Error creating session:", error);
      alert(`An error occurred: ${error.message || "Please try again."}`);
    }
  };

  const handleCreateMasterEvent = async () => {
    if (!masterEventFormData.name) {
      alert("Please enter a name for the activity");
      return;
    }

    try {
      const response = await fetch("/api/master-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: masterEventFormData.name.trim(),
          type: masterEventFormData.type,
          description: masterEventFormData.description?.trim() || null,
          campusId: masterEventFormData.campusId && masterEventFormData.campusId !== "" ? masterEventFormData.campusId : null,
          defaultStartTime: masterEventFormData.defaultStartTime && masterEventFormData.defaultStartTime !== "" ? masterEventFormData.defaultStartTime : null,
          defaultDuration: masterEventFormData.defaultDuration && masterEventFormData.defaultDuration !== "" ? parseInt(masterEventFormData.defaultDuration) : null,
          isRecurring: masterEventFormData.isRecurring,
        }),
      });

      // Clone response to read it without consuming
      const responseClone = response.clone();
      let data: any = {};
      
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        const responseText = await responseClone.text();
        console.error("Failed to parse response as JSON:", responseText);
        console.error("Response status:", response.status);
        console.error("Response headers:", Object.fromEntries(response.headers.entries()));
        alert(`Failed to create activity. Server returned: ${response.status} ${response.statusText}\n\nResponse: ${responseText.substring(0, 200)}`);
        return;
      }

      if (response.ok) {
        setMasterEventDialogOpen(false);
        setMasterEventFormData({
          name: "",
          type: "SERVICE",
          description: "",
          campusId: "",
          defaultStartTime: "",
          defaultDuration: "",
          isRecurring: true,
        });
        fetchMasterEvents();
        // Auto-select the newly created master event
        // API returns the master event directly, not wrapped
        if (data.id) {
          setSelectedMasterEventId(data.id);
        }
        alert("Activity created successfully!");
      } else {
        const errorMsg = data?.error || `Failed to create activity (${response.status})`;
        const details = data?.details ? `\n\nDetails: ${data.details}` : "";
        const code = data?.code ? `\n\nError Code: ${data.code}` : "";
        
        console.error("Master event creation error:", {
          status: response.status,
          statusText: response.statusText,
          responseText,
          parsedData: data,
          requestBody: {
            name: masterEventFormData.name,
            type: masterEventFormData.type,
            description: masterEventFormData.description,
            campusId: masterEventFormData.campusId,
            defaultStartTime: masterEventFormData.defaultStartTime,
            defaultDuration: masterEventFormData.defaultDuration,
            isRecurring: masterEventFormData.isRecurring,
          },
        });
        
        alert(errorMsg + details + code);
      }
    } catch (error: any) {
      console.error("Error creating master event:", error);
      alert(`An error occurred: ${error.message || "Please try again."}`);
    }
  };

  const selectedMasterEvent = masterEvents.find((e) => e.id === selectedMasterEventId);
  const selectedSession = attendanceSessions.find((s) => s.id === selectedSessionId);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SERVICE":
        return { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" };
      case "GROUP":
        return { bg: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" };
      case "EVENT":
        return { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" };
      case "MEETING":
        return { bg: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" };
      default:
        return { bg: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Tabs defaultValue="sessions" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 rounded-none shadow-sm">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-blue-50 data-[state=active]:dark:bg-blue-900/30 data-[state=active]:text-blue-700 data-[state=active]:dark:text-blue-400">Attendance Sessions</TabsTrigger>
          <TabsTrigger value="biometric" className="data-[state=active]:bg-blue-50 data-[state=active]:dark:bg-blue-900/30 data-[state=active]:text-blue-700 data-[state=active]:dark:text-blue-400 flex items-center gap-2">
            Biometric Devices
            <PremiumBadge size="sm" />
          </TabsTrigger>
          <TabsTrigger value="link-users" className="data-[state=active]:bg-blue-50 data-[state=active]:dark:bg-blue-900/30 data-[state=active]:text-blue-700 data-[state=active]:dark:text-blue-400 flex items-center gap-2">
            Link Users
            <PremiumBadge size="sm" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions" className="flex-1 overflow-hidden m-0 p-6 bg-gray-50 dark:bg-gray-950">
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Left Column: Master Events & Sessions */}
              <div className="lg:col-span-1 space-y-6 overflow-y-auto">
                {/* Master Events Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Activities</span>
                      <Dialog open={masterEventDialogOpen} onOpenChange={setMasterEventDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-1" />
                            New
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Activity</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Activity Name *</Label>
                              <Input
                                value={masterEventFormData.name}
                                onChange={(e) =>
                                  setMasterEventFormData({
                                    ...masterEventFormData,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="e.g., Sunday Service"
                              />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <Select
                                value={masterEventFormData.type}
                                onValueChange={(value: any) =>
                                  setMasterEventFormData({
                                    ...masterEventFormData,
                                    type: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SERVICE">Service</SelectItem>
                                  <SelectItem value="GROUP">Group</SelectItem>
                                  <SelectItem value="EVENT">Event</SelectItem>
                                  <SelectItem value="MEETING">Meeting</SelectItem>
                                  <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                                  <SelectItem value="TRAINING">Training</SelectItem>
                                  <SelectItem value="OUTREACH">Outreach</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={masterEventFormData.description}
                                onChange={(e) =>
                                  setMasterEventFormData({
                                    ...masterEventFormData,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Optional description"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setMasterEventDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleCreateMasterEvent}>
                                Create Activity
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : masterEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">No activities found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                          Create your first activity to start tracking attendance
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setMasterEventDialogOpen(true)}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Activity
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {masterEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                              selectedMasterEventId === event.id
                                ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-800"
                            }`}
                            onClick={() => setSelectedMasterEventId(event.id)}
                          >
                            <p className="font-medium text-gray-900 dark:text-white">{event.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTypeColor(event.type).bg}`}
                              >
                                {event.type}
                              </Badge>
                              {event.campus && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {event.campus.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sessions Card */}
                {selectedMasterEventId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Sessions</span>
                        <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="w-4 h-4 mr-1" />
                              New
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Attendance Session</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Date *</Label>
                                <Input
                                  type="date"
                                  value={sessionFormData.date}
                                  onChange={(e) =>
                                    setSessionFormData({
                                      ...sessionFormData,
                                      date: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Start Time *</Label>
                                <Input
                                  type="time"
                                  value={sessionFormData.startTime}
                                  onChange={(e) =>
                                    setSessionFormData({
                                      ...sessionFormData,
                                      startTime: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>End Time</Label>
                                <Input
                                  type="time"
                                  value={sessionFormData.endTime}
                                  onChange={(e) =>
                                    setSessionFormData({
                                      ...sessionFormData,
                                      endTime: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Location</Label>
                                <Input
                                  value={sessionFormData.location}
                                  onChange={(e) =>
                                    setSessionFormData({
                                      ...sessionFormData,
                                      location: e.target.value,
                                    })
                                  }
                                  placeholder="Optional location"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setSessionDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleCreateSession}>
                                  Create Session
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : attendanceSessions.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                          <p className="text-gray-600 dark:text-gray-400 mb-2">No sessions found</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                            Create a new session to capture attendance
                          </p>
                          <Button
                            size="sm"
                            onClick={() => setSessionDialogOpen(true)}
                            variant="outline"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Session Now
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {attendanceSessions.map((session) => (
                            <div
                              key={session.id}
                              className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                                selectedSessionId === session.id
                                  ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-800"
                              }`}
                              onClick={() => setSelectedSessionId(session.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {session.name || selectedMasterEvent?.name}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(session.date), "MMM d, yyyy")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(new Date(session.startTime), "h:mm a")}
                                    </span>
                                    {session.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {session.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {session._count.attendees}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">attended</p>
                                </div>
                              </div>
                              {session.isJointService && (
                                <Badge variant="outline" className="mt-2">
                                  Joint Service
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Attendance Capture */}
              <div className="lg:col-span-2">
                {selectedSessionId && selectedSession && selectedMasterEvent ? (
                  <AttendanceCapture
                    type="session"
                    referenceId={selectedSessionId}
                    referenceName={`${selectedSession.name || selectedMasterEvent.name} - ${format(
                      new Date(selectedSession.date),
                      "MMM d, yyyy"
                    )}`}
                  />
                ) : selectedMasterEventId ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select or Create a Session
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Choose an existing session from the list or create a new one to start
                        capturing attendance.
                      </p>
                      <Button onClick={() => setSessionDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Session
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select an Activity
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Choose an activity from the list to view and create attendance sessions.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="biometric" className="flex-1 overflow-y-auto m-0 p-6 bg-gray-950 dark:bg-gray-950">
          <BiometricDeviceManager />
        </TabsContent>

        <TabsContent value="link-users" className="flex-1 overflow-y-auto m-0 p-6 bg-gray-950 dark:bg-gray-950">
          <BiometricUserMapper />
        </TabsContent>
      </Tabs>
    </div>
  );
}
