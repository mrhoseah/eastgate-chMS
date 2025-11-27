import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Church,
  Users,
  Shield,
  Settings,
  Database,
  TrendingUp,
  Activity,
  Mail,
  Crown,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

export default async function SystemAdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Only SUPERADMIN can access this page
  if (session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  // Get system-wide statistics
  const [
    totalChurches,
    activeChurches,
    totalUsers,
    systemAdmins,
    churchAdmins,
    totalDonations,
    recentChurches,
  ] = await Promise.all([
    prisma.church.count(),
    prisma.church.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "SUPERADMIN" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { status: "completed" },
    }),
    prisma.church.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            campuses: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          System Administration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage the entire church management system
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChurches}</div>
            <p className="text-xs text-muted-foreground">
              {activeChurches} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all churches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemAdmins + churchAdmins}</div>
            <p className="text-xs text-muted-foreground">
              {systemAdmins} system, {churchAdmins} church
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Giving</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {(totalDonations._sum.amount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time donations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link href="/admin/churches">
                <Church className="h-8 w-8 mb-2" />
                <span>Manage Churches</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link href="/admin/system-admins">
                <Shield className="h-8 w-8 mb-2" />
                <span>System Admins</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link href="/admin/announcements">
                <Megaphone className="h-8 w-8 mb-2" />
                <span>Announcements</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link href="/admin/invite">
                <Mail className="h-8 w-8 mb-2" />
                <span>Invite Admin</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Churches */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Added Churches</CardTitle>
          <CardDescription>Latest churches registered in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentChurches.map((church) => (
              <div
                key={church.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Church className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{church.name}</p>
                      {church.isSponsored && (
                        <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {church._count.campuses} campus{church._count.campuses !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={church.isActive ? "default" : "secondary"}>
                    {church.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button asChild size="sm">
                    <Link href={`/admin/churches/${church.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Database</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Operational</p>
                </div>
              </div>
              <Badge className="bg-green-500">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">API Services</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">All systems operational</p>
                </div>
              </div>
              <Badge variant="secondary">Healthy</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
