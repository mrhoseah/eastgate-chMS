"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPermissionsDialog } from "@/components/user-permissions-dialog";
import { FamilyTree } from "@/components/family-tree";

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/people">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Members
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Member Profile</h1>
        </div>
        <div className="flex gap-2">
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
              Edit Member
            </Button>
          </Link>
        </div>
      </div>

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

          {/* Family Information */}
          {(member.spouse || member.parent || (member.children?.length ?? 0) > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Family
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {member.spouse && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Spouse</p>
                    <Link href={`/dashboard/people/${member.spouse.id}`} className="flex items-center gap-2 hover:underline">
                      <User className="w-4 h-4" />
                      <span>{member.spouse.firstName} {member.spouse.lastName}</span>
                    </Link>
                  </div>
                )}
                {member.parent && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Parent</p>
                    <Link href={`/dashboard/people/${member.parent.id}`} className="flex items-center gap-2 hover:underline">
                      <User className="w-4 h-4" />
                      <span>{member.parent.firstName} {member.parent.lastName}</span>
                    </Link>
                  </div>
                )}
                {(member.children?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Children ({member.children?.length ?? 0})</p>
                    <div className="space-y-2">
                      {member.children?.map((child: any) => (
                        <Link 
                          key={child.id} 
                          href={`/dashboard/people/${child.id}`} 
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Baby className="w-4 h-4" />
                          <span>
                            {child.firstName} {child.lastName}
                            {child.dateOfBirth && ` (${Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years)`}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Family Tree Visualization */}
                <div className="pt-4 border-t">
                  <FamilyTree member={member} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group Memberships */}
          {(member.groupMemberships?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Group Memberships ({member.groupMemberships?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {member.groupMemberships?.map((membership: any) => (
                    <Link
                      key={membership.id}
                      href={`/dashboard/groups/${membership.group.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{membership.group.name}</p>
                        <div className="flex gap-2 mt-1">
                          {membership.group.type && (
                            <Badge variant="outline" className="text-xs">
                              {membership.group.type}
                            </Badge>
                          )}
                          <Badge variant={membership.isLeader ? "default" : "secondary"} className="text-xs">
                            {membership.role}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        Joined {new Date(membership.joinedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Attendance */}
          {(member.attendances?.length ?? 0) > 0 && (
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
              </CardContent>
            </Card>
          )}

          {/* Giving Summary */}
          {(member.donations?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Giving History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">Total Contributions</p>
                    <p className="text-2xl font-bold">
                      KES{" "}
                      {(member.donations?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {member.donations?.slice(0, 5).map((donation: any) => (
                      <div key={donation.id} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium">{donation.category}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-bold">
                          KES {Number(donation.amount).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
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
              <div className="flex justify-between">
                <span className="text-gray-500">Member Since:</span>
                <span>{new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
              {member.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span>{new Date(member.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
