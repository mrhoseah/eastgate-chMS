"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Mail,
  Phone,
  Edit,
  ArrowLeft,
  Users,
  Package,
  Crown,
  Loader2,
  Activity,
  TrendingUp,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DepartmentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string>("");

  useEffect(() => {
    params.then(({ id }) => {
      setDepartmentId(id);
      fetchDepartment(id);
    });
  }, [params]);

  const fetchDepartment = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/departments/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/departments");
          return;
        }
        throw new Error("Failed to fetch department");
      }
      const data = await response.json();
      setDepartment(data);
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
          <Button onClick={() => router.push("/dashboard/departments")} className="mt-4">
            Back to Departments
          </Button>
        </div>
      </div>
    );
  }

  if (!department) {
    return null;
  }

  const staffCount = department.staff?.length ?? 0;
  const inventoryCount = department.inventoryItems?.length ?? 0;
  const leadershipCount = department.leadershipAssignments?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/departments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Departments
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Department Details</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/departments?edit=${department.id}`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Department
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Building2 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="w-4 h-4 mr-2" />
            Staff ({staffCount})
          </TabsTrigger>
          <TabsTrigger value="leadership">
            <Crown className="w-4 h-4 mr-2" />
            Leadership ({leadershipCount})
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            Inventory ({inventoryCount})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Department Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{department.name}</h2>
                      <Badge variant={department.isActive ? "default" : "secondary"} className="mt-2">
                        {department.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  {department.description && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                      <p className="text-gray-700 dark:text-gray-300">{department.description}</p>
                    </div>
                  )}

                  {/* Primary Leader */}
                  {department.leader && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-500 mb-3">Primary Leader</p>
                      <Link
                        href={`/dashboard/people/${department.leader.id}`}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {department.leader.firstName} {department.leader.lastName}
                          </p>
                          {department.leader.email && (
                            <p className="text-sm text-gray-500">{department.leader.email}</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Total Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{staffCount}</p>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Leadership Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{leadershipCount}</p>
                      <Crown className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Inventory Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{inventoryCount}</p>
                      <Package className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Department Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Department Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <Badge variant={department.isActive ? "default" : "secondary"}>
                      {department.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{new Date(department.createdAt).toLocaleDateString()}</span>
                  </div>
                  {department.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated:</span>
                      <span>{new Date(department.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>
                {staffCount} staff member{staffCount !== 1 ? "s" : ""} in this department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffCount > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.staff?.map((staff: any) => (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/people/${staff.user.id}`}
                            className="font-medium hover:underline"
                          >
                            {staff.user.firstName} {staff.user.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>{staff.position || "—"}</TableCell>
                        <TableCell>
                          {staff.user.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              {staff.user.email}
                            </div>
                          )}
                          {staff.user.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              {staff.user.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={staff.isActive ? "default" : "secondary"}>
                            {staff.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/people/${staff.user.id}`}>
                            <Button variant="ghost" size="sm">
                              <User className="w-4 h-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No staff members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leadership Tab */}
        <TabsContent value="leadership" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leadership Team</CardTitle>
              <CardDescription>
                {leadershipCount} leadership position{leadershipCount !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadershipCount > 0 ? (
                <div className="space-y-4">
                  {department.leadershipAssignments?.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{assignment.title}</h3>
                          {assignment.isPrimary && (
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <Link
                          href={`/dashboard/people/${assignment.user.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {assignment.user.firstName} {assignment.user.lastName}
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Start: {new Date(assignment.startDate).toLocaleDateString()}
                          </div>
                          {assignment.endDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              End: {new Date(assignment.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Crown className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No leadership assignments found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                {inventoryCount} item{inventoryCount !== 1 ? "s" : ""} in inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryCount > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.inventoryItems?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.sku || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={item.quantity < 10 ? "text-red-600 font-semibold" : ""}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No inventory items found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
