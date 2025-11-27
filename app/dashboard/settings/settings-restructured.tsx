"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Smartphone,
  Mail,
  Shield,
  Key,
  Image,
  DollarSign,
  MessageSquare,
  LayoutDashboard,
  Info,
  Plug,
  Tag,
  Church,
  Server,
  Users,
} from "lucide-react";

export function SettingsRestructured() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mainTab, setMainTab] = useState<string>("system");
  const [churchTab, setChurchTab] = useState<string>("overview");
  const [loading, setLoading] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<any>(null);
  const [churches, setChurches] = useState<any[]>([]);
  
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";

  // System settings from ENV
  const [cognitoSettings, setCognitoSettings] = useState({
    userPoolId: "",
    clientId: "",
    region: "",
  });
  const [cloudinarySettings, setCloudinarySettings] = useState({
    cloudName: "",
    apiKey: "",
  });

  // Church settings from DB
  const [mpesaSettings, setMpesaSettings] = useState({
    consumerKey: "",
    consumerSecret: "",
    shortcode: "",
    passkey: "",
    paybillNumber: "",
  });
  const [smsSettings, setSmsSettings] = useState({
    apiKey: "",
    username: "",
    senderId: "",
  });
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
  });

  // Load churches for SUPERADMIN
  useEffect(() => {
    const loadChurches = async () => {
      if (isSuperAdmin) {
        try {
          const res = await fetch("/api/churches");
          if (res.ok) {
            const data = await res.json();
            setChurches(data.churches || []);
          }
        } catch (error) {
          console.error("Error loading churches:", error);
        }
      }
    };
    loadChurches();
  }, [isSuperAdmin]);

  // Load system settings from ENV
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const res = await fetch("/api/settings/system");
        if (res.ok) {
          const data = await res.json();
          if (data.cognito) setCognitoSettings(data.cognito);
          if (data.cloudinary) setCloudinarySettings(data.cloudinary);
        }
      } catch (error) {
        console.error("Error loading system settings:", error);
      }
    };
    loadSystemSettings();
  }, []);

  // Load church settings when church is selected
  useEffect(() => {
    const loadChurchSettings = async () => {
      if (!selectedChurch?.id) return;
      
      try {
        const res = await fetch(`/api/churches/${selectedChurch.id}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.mpesa) setMpesaSettings(data.mpesa);
          if (data.sms) setSmsSettings(data.sms);
          if (data.email) setEmailSettings(data.email);
        }
      } catch (error) {
        console.error("Error loading church settings:", error);
      }
    };
    loadChurchSettings();
  }, [selectedChurch]);

  const handleSaveChurchSettings = async (settingType: string, settings: any) => {
    if (!selectedChurch?.id) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/churches/${selectedChurch.id}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [settingType]: settings }),
      });

      if (res.ok) {
        alert(`${settingType} settings saved successfully!`);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your church management system settings
        </p>
      </div>

      {/* Main Horizontal Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 max-w-md">
          <TabsTrigger value="system">
            <Server className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Users className="w-4 h-4 mr-2" />
            Admins
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="church">
              <Church className="w-4 h-4 mr-2" />
              Church
            </TabsTrigger>
          )}
        </TabsList>

        {/* System Tab Content */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Environment and database settings (read from .env and system configuration)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Cognito Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Key className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">AWS Cognito Authentication</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>User Pool ID</Label>
                    <Input
                      value={cognitoSettings.userPoolId}
                      disabled
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set in environment variables</p>
                  </div>
                  <div>
                    <Label>Client ID</Label>
                    <Input
                      value={cognitoSettings.clientId}
                      disabled
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set in environment variables</p>
                  </div>
                  <div>
                    <Label>Region</Label>
                    <Input
                      value={cognitoSettings.region}
                      disabled
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Cloudinary Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Image className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Cloudinary Media Storage</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cloud Name</Label>
                    <Input
                      value={cloudinarySettings.cloudName}
                      disabled
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set in environment variables</p>
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      value={cloudinarySettings.apiKey}
                      disabled
                      type="password"
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set in environment variables</p>
                  </div>
                </div>
              </div>

              {/* Database Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Info className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">System Status</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                      <Badge className="bg-green-500">Connected</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Auth</span>
                      <Badge variant="secondary">Configured</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab Content */}
        <TabsContent value="admins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Administrator Management</CardTitle>
              <CardDescription>
                Manage system administrators and invite church admins via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Invite Church Admin</h3>
                  <p className="text-sm text-gray-500">Send invitation email with role assignment</p>
                </div>
                <Button onClick={() => router.push("/dashboard/admin/invite")}>
                  <Mail className="w-4 h-4 mr-2" />
                  Invite Admin
                </Button>
              </div>

              {isSuperAdmin && (
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">System Administrators</h3>
                      <p className="text-sm text-gray-500">Manage users with SUPERADMIN role</p>
                    </div>
                    <Button onClick={() => router.push("/dashboard/admin/system-admins")}>
                      <Users className="w-4 h-4 mr-2" />
                      Manage System Admins
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Church Tab Content - Only for SUPERADMIN */}
        {isSuperAdmin && (
          <TabsContent value="church" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Church Settings</CardTitle>
                <CardDescription>
                  Select a church to manage its database-stored settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Select Church</Label>
                  <Select
                    value={selectedChurch?.id || ""}
                    onValueChange={(value) => {
                      const church = churches.find((c) => c.id === value);
                      setSelectedChurch(church);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a church to configure" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedChurch && (
                  <div className="space-y-6 pt-4 border-t">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <Church className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            {selectedChurch.name}
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Configure church-specific settings stored in database
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vertical Tabs for Church Settings */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Church Configuration</h3>
                      
                      {/* M-Pesa Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            M-Pesa Payment Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Consumer Key</Label>
                              <Input
                                value={mpesaSettings.consumerKey}
                                onChange={(e) => setMpesaSettings({...mpesaSettings, consumerKey: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Consumer Secret</Label>
                              <Input
                                type="password"
                                value={mpesaSettings.consumerSecret}
                                onChange={(e) => setMpesaSettings({...mpesaSettings, consumerSecret: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Shortcode</Label>
                              <Input
                                value={mpesaSettings.shortcode}
                                onChange={(e) => setMpesaSettings({...mpesaSettings, shortcode: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Paybill Number</Label>
                              <Input
                                value={mpesaSettings.paybillNumber}
                                onChange={(e) => setMpesaSettings({...mpesaSettings, paybillNumber: e.target.value})}
                              />
                            </div>
                          </div>
                          <Button onClick={() => handleSaveChurchSettings("mpesa", mpesaSettings)} disabled={loading}>
                            Save M-Pesa Settings
                          </Button>
                        </CardContent>
                      </Card>

                      {/* SMS Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            SMS Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>API Key</Label>
                              <Input
                                value={smsSettings.apiKey}
                                onChange={(e) => setSmsSettings({...smsSettings, apiKey: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Username</Label>
                              <Input
                                value={smsSettings.username}
                                onChange={(e) => setSmsSettings({...smsSettings, username: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Sender ID</Label>
                              <Input
                                value={smsSettings.senderId}
                                onChange={(e) => setSmsSettings({...smsSettings, senderId: e.target.value})}
                              />
                            </div>
                          </div>
                          <Button onClick={() => handleSaveChurchSettings("sms", smsSettings)} disabled={loading}>
                            Save SMS Settings
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Email Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Email Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>SMTP Host</Label>
                              <Input
                                value={emailSettings.smtpHost}
                                onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>SMTP Port</Label>
                              <Input
                                value={emailSettings.smtpPort}
                                onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>SMTP User</Label>
                              <Input
                                value={emailSettings.smtpUser}
                                onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>From Email</Label>
                              <Input
                                type="email"
                                value={emailSettings.fromEmail}
                                onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                              />
                            </div>
                          </div>
                          <Button onClick={() => handleSaveChurchSettings("email", emailSettings)} disabled={loading}>
                            Save Email Settings
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
