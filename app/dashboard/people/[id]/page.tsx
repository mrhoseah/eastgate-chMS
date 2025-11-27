"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit,
  ArrowLeft,
  Users,
  Heart,
  Baby,
  Loader2,
  Activity,
  DollarSign,
  History,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPermissionsDialog } from "@/components/user-permissions-dialog";
import { FamilyTree } from "@/components/family-tree";
import { AddFamilyMemberDialog } from "@/components/add-family-member-dialog";
import { FamilyPhotoUpload } from "@/components/family-photo-upload";
import { AssignFamilyHeadDialog } from "@/components/assign-family-head-dialog";
import { FamilyNameEditor } from "@/components/family-name-editor";
import { GuestVisitManager } from "@/components/guest-visit-manager";
import { GuestFollowUpManager } from "@/components/guest-follow-up-manager";
import { GuestFollowUpToggle } from "@/components/guest-follow-up-toggle";
import { formatDistanceToNow } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MemberProfilePage({ params }: PageProps) {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string>("");

  useEffect(() => {
    params.then(({ id }) => {
      setMemberId(id);
      fetchMember(id);
    });
  }, [params]);

  const fetchMember = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/people/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/people");
          return;
        }
        throw new Error("Failed to fetch member");
      }
      const data = await response.json();
      setMember(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push("/dashboard/people")} className="mt-4">
            Back to Members
          </Button>
        </div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  const isGuest = member.role === "GUEST";
  const totalDonations = member.donations?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) ?? 0;
  const attendanceRate = member.attendances?.length > 0 
    ? (member.attendances.filter((a: any) => a.status === "PRESENT").length / member.attendances.length) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/people">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {isGuest ? "Guests" : "Members"}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{isGuest ? "Guest" : "Member"} Profile</h1>
        </div>
        <div className="flex gap-2">
          {isGuest && (
            <GuestFollowUpToggle
              guestId={member.id}
              enableFollowUps={member.enableFollowUps}
              onToggle={() => fetchMember(memberId)}
            />
          )}
          <UserPermissionsDialog
            userId={member.id}
            userName={`${member.firstName} ${member.lastName}`}
            userRole={member.role}
            canLogin={member.canLogin || false}
            userStatus={member.status}
            onUpdate={() => fetchMember(memberId)}
          />
          <Link href={`/dashboard/people?edit=${member.id}`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          {!isGuest && (
            <>
              <TabsTrigger value="attendance">
                <Activity className="w-4 h-4 mr-2" />
                Attendance ({member.attendances?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="giving">
                <DollarSign className="w-4 h-4 mr-2" />
                Giving History
              </TabsTrigger>
            </>
          )}
          {isGuest && (
            <>
              <TabsTrigger value="visits">
                <History className="w-4 h-4 mr-2" />
                Visit History ({member.guestVisits?.length ?? 0})
              </TabsTrigger>
              {member.enableFollowUps && (
                <TabsTrigger value="follow-ups">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Follow-ups ({member.guestFollowUps?.length ?? 0})
                </TabsTrigger>
              )}
            </>
          )}
          {(member.groupMemberships?.length ?? 0) > 0 && (
            <TabsTrigger value="groups">
              <Users className="w-4 h-4 mr-2" />
              Groups ({member.groupMemberships?.length ?? 0})
            </TabsTrigger>
          )}
          <TabsTrigger value="family">
            <Heart className="w-4 h-4 mr-2" />
            Family
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {member.title} {member.firstName} {member.middleName} {member.lastName}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                      {member.status}
                    </Badge>
                    <Badge variant="outline">{member.role}</Badge>
                    {member.gender && <Badge variant="outline">{member.gender}</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.dateOfBirth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      Born: {new Date(member.dateOfBirth).toLocaleDateString()}
                      {" "}({Math.floor((Date.now() - new Date(member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years)
                    </span>
                  </div>
                )}
                {member.maritalStatus && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span>{member.maritalStatus}</span>
                  </div>
                )}
                {member.profession && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span>{member.profession}</span>
                  </div>
                )}
                {(member.residence || member.county || member.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>
                      {[member.residence, member.county, member.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {!isGuest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Giving
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        KES {totalDonations.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.donations?.length ?? 0} donations
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Attendance Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {attendanceRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.attendances?.length ?? 0} records
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Group Involvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {member.groupMemberships?.length ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.groupMemberships?.filter((g: any) => g.isLeader).length ?? 0} as leader
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Guest Stats */}
          {isGuest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {member.guestVisits?.length ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.guestVisits?.[0] && `Last visit: ${formatDistanceToNow(new Date(member.guestVisits[0].visitDate), { addSuffix: true })}`}
                      </p>
                    </div>
                    <History className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Follow-up Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {member.guestFollowUps?.filter((f: any) => f.status === "PENDING").length ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.guestFollowUps?.length ?? 0} total follow-ups
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity for Members */}
          {!isGuest && (member.attendances?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.attendances?.slice(0, 5).map((att: any) => (
                    <div key={att.id} className="text-sm">
                      <p className="font-medium capitalize">{att.type}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(att.date).toLocaleDateString()}
                      </p>
                      <Badge variant={att.status === "PRESENT" ? "default" : "secondary"} className="text-xs mt-1">
                        {att.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link href={`#attendance`} className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Attendance
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recent Visits for Guests */}
          {isGuest && (member.guestVisits?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.guestVisits?.slice(0, 5).map((visit: any) => (
                    <div key={visit.id} className="text-sm border-b pb-2 last:border-0">
                      <p className="font-medium">{visit.serviceType || "General Service"}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </p>
                      {visit.notes && (
                        <p className="text-xs text-gray-600 mt-1">{visit.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Login Access:</span>
                <Badge variant={member.canLogin ? "default" : "secondary"}>
                  {member.canLogin ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {!isGuest && member.memberSince && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since:</span>
                  <span>{new Date(member.memberSince).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Record Created:</span>
                <span>{new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
              {member.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span>{new Date(member.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
              {member.campus && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Campus:</span>
                  <span>{member.campus.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </div>
        </TabsContent>

        {/* Attendance Tab (Members Only) */}
        {!isGuest && (
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  Complete attendance record with {attendanceRate.toFixed(0)}% attendance rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(member.attendances?.length ?? 0) > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500">Total Records</p>
                        <p className="text-2xl font-bold">{member.attendances?.length ?? 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500">Present</p>
                        <p className="text-2xl font-bold text-green-600">
                          {member.attendances?.filter((a: any) => a.status === "PRESENT").length ?? 0}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500">Absent</p>
                        <p className="text-2xl font-bold text-red-600">
                          {member.attendances?.filter((a: any) => a.status === "ABSENT").length ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {member.attendances?.map((att: any) => (
                        <div key={att.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${att.status === "PRESENT" ? "bg-green-500" : "bg-red-500"}`} />
                            <div>
                              <p className="font-medium capitalize">{att.type} Service</p>
                              <p className="text-sm text-gray-500">
                                {new Date(att.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge variant={att.status === "PRESENT" ? "default" : "secondary"}>
                            {att.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No attendance records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Giving Tab (Members Only) */}
        {!isGuest && (
          <TabsContent value="giving" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Giving History</CardTitle>
                <CardDescription>
                  Total contributions: KES {totalDonations.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(member.donations?.length ?? 0) > 0 ? (
                  <div className="space-y-4">
                    {/* Giving Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          KES {totalDonations.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500">Total Donations</p>
                        <p className="text-2xl font-bold">{member.donations?.length ?? 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500">Average Gift</p>
                        <p className="text-2xl font-bold">
                          KES {Math.round(totalDonations / (member.donations?.length ?? 1)).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-500">Last Gift</p>
                        <p className="text-sm font-medium">
                          {member.donations?.[0] && formatDistanceToNow(new Date(member.donations[0].createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Donations List */}
                    <div className="space-y-2">
                      {member.donations?.map((donation: any) => (
                        <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{donation.category}</p>
                            <div className="flex gap-2 mt-1">
                              <p className="text-sm text-gray-500">
                                {new Date(donation.createdAt).toLocaleDateString()}
                              </p>
                              {donation.paymentMethod && (
                                <Badge variant="outline" className="text-xs">
                                  {donation.paymentMethod}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            KES {Number(donation.amount).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No giving records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Visit History Tab (Guests Only) */}
        {isGuest && (
          <TabsContent value="visits" className="space-y-6">
            <GuestVisitManager guestId={member.id} initialVisits={member.guestVisits ?? []} />
          </TabsContent>
        )}

        {/* Follow-ups Tab (Guests Only) */}
        {isGuest && member.enableFollowUps && (
          <TabsContent value="follow-ups" className="space-y-6">
            <GuestFollowUpManager 
              guestId={member.id} 
              guestName={`${member.firstName} ${member.lastName}`}
              initialFollowUps={member.guestFollowUps ?? []} 
            />
          </TabsContent>
        )}

        {/* Groups Tab */}
        {(member.groupMemberships?.length ?? 0) > 0 && (
          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Memberships</CardTitle>
                <CardDescription>
                  Active in {member.groupMemberships?.length ?? 0} groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {member.groupMemberships?.map((membership: any) => (
                    <Link
                      key={membership.id}
                      href={`/dashboard/groups/${membership.group.id}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{membership.group.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {membership.group.type && (
                              <Badge variant="outline" className="text-xs">
                                {membership.group.type}
                              </Badge>
                            )}
                            <Badge 
                              variant={membership.isLeader ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {membership.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(membership.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Family Tab */}
        <TabsContent value="family" className="space-y-6">
          {/* Full Width Family Tree Visualization */}
          <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Family Tree Visualization
                    </CardTitle>
                    <CardDescription>
                      Interactive family relationship diagram
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-950/30"
                      onClick={() => {
                        const dialog = document.querySelector('[data-family-dialog="spouse"]') as HTMLButtonElement;
                        dialog?.click();
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Add Spouse
                    </Button>
                    <div className="hidden">
                      <AddFamilyMemberDialog userId={member.id} relationship="spouse" data-family-dialog="spouse" />
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30"
                      onClick={() => {
                        const dialog = document.querySelector('[data-family-dialog="parent"]') as HTMLButtonElement;
                        dialog?.click();
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Add Parent
                    </Button>
                    <div className="hidden">
                      <AddFamilyMemberDialog userId={member.id} relationship="parent" data-family-dialog="parent" />
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      onClick={() => {
                        const dialog = document.querySelector('[data-family-dialog="child"]') as HTMLButtonElement;
                        dialog?.click();
                      }}
                    >
                      <Baby className="w-4 h-4 mr-2" />
                      Add Child
                    </Button>
                    <div className="hidden">
                      <AddFamilyMemberDialog userId={member.id} relationship="child" data-family-dialog="child" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Family Photo and Identity Section */}
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <div className="flex-shrink-0">
                    {member.familyPhoto ? (
                      <img
                        src={member.familyPhoto}
                        alt="Family Photo"
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Users className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {member.familyName || "Family"}
                        </h3>
                        <FamilyNameEditor
                          userId={member.id}
                          currentFamilyName={member.familyName}
                        />
                      </div>
                      {member.familyHead && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Family Head: {member.familyHead.firstName} {member.familyHead.lastName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <FamilyPhotoUpload
                        userId={member.id}
                        currentPhoto={member.familyPhoto}
                      />
                      <AssignFamilyHeadDialog
                        userId={member.id}
                        currentFamilyHead={member.familyHead}
                        familyMembers={[
                          { id: member.id, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone },
                          ...(member.spouse ? [{ id: member.spouse.id, firstName: member.spouse.firstName, lastName: member.spouse.lastName, email: member.spouse.email, phone: member.spouse.phone }] : []),
                          ...(member.children?.map((child: any) => ({ id: child.id, firstName: child.firstName, lastName: child.lastName, email: child.email, phone: child.phone })) ?? []),
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <FamilyTree 
                  member={member} 
                  spouse={member.spouse}
                  parent={member.parent}
                  children={member.children ?? []}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Family Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Family Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Spouse</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {member.spouse ? '1' : '0'}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Baby className="w-4 h-4 text-blue-500" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Children</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {member.children?.length ?? 0}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-purple-500" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Parent</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {member.parent ? '1' : '0'}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {(member.spouse ? 1 : 0) + (member.children?.length ?? 0) + (member.parent ? 1 : 0) + 1}
                      </p>
                    </div>
                  </div>

                  {/* Family Info */}
                  <div className="pt-4 border-t space-y-3">
                    {member.maritalStatus && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Marital Status</span>
                        <Badge variant="outline">{member.maritalStatus}</Badge>
                      </div>
                    )}
                    {member.weddingAnniversary && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Anniversary</span>
                        <span className="text-sm font-medium">
                          {new Date(member.weddingAnniversary).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {member.familyName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Family Name</span>
                        <span className="text-sm font-medium">{member.familyName}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Family Members List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Family Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.spouse && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2 font-medium">Spouse</p>
                      <Link 
                        href={`/dashboard/people/${member.spouse.id}`} 
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-pink-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {member.spouse.firstName} {member.spouse.lastName}
                          </p>
                          <p className="text-xs text-gray-500">Spouse</p>
                        </div>
                        {member.spouse.phone && (
                          <p className="text-xs text-gray-500">{member.spouse.phone}</p>
                        )}
                      </Link>
                    </div>
                  )}

                  {member.parent && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2 font-medium">Parent</p>
                      <Link 
                        href={`/dashboard/people/${member.parent.id}`} 
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {member.parent.firstName} {member.parent.lastName}
                          </p>
                          <p className="text-xs text-gray-500">Parent</p>
                        </div>
                      </Link>
                    </div>
                  )}

                  {(member.children?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2 font-medium">
                        Children ({member.children?.length ?? 0})
                      </p>
                      <div className="space-y-2">
                        {member.children?.map((child: any) => (
                          <Link 
                            key={child.id} 
                            href={`/dashboard/people/${child.id}`} 
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Baby className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {child.firstName} {child.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {child.dateOfBirth 
                                  ? `${Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old`
                                  : "Child"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}
