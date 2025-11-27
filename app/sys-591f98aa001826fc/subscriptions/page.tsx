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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Crown,
  Plus,
  Loader2,
  Edit,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  churchId: string;
  church: {
    name: string;
    email: string | null;
  };
  plan: string;
  status: string;
  billingCycle: string | null;
  amount: string | null;
  currency: string;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
}

const planColors: Record<string, string> = {
  FREE: "bg-gray-500",
  BASIC: "bg-blue-500",
  PREMIUM: "bg-purple-500",
  ENTERPRISE: "bg-yellow-500",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  cancelled: "bg-red-500",
  expired: "bg-gray-500",
  trial: "bg-blue-500",
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    churchId: "",
    plan: "BASIC",
    status: "active",
    billingCycle: "monthly",
    amount: "",
    currency: "USD",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    trialEndDate: "",
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      const data = await response.json();
      setSubscriptions(data);
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
      const url = editingSub
        ? `/api/admin/subscriptions/${editingSub.id}`
        : "/api/admin/subscriptions";

      const response = await fetch(url, {
        method: editingSub ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save subscription");
      }

      toast({
        title: "Success",
        description: `Subscription ${editingSub ? "updated" : "created"} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchSubscriptions();
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

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      churchId: sub.churchId,
      plan: sub.plan,
      status: sub.status,
      billingCycle: sub.billingCycle || "monthly",
      amount: sub.amount || "",
      currency: sub.currency,
      startDate: sub.startDate.split("T")[0],
      endDate: sub.endDate ? sub.endDate.split("T")[0] : "",
      trialEndDate: sub.trialEndDate ? sub.trialEndDate.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSub(null);
    setFormData({
      churchId: "",
      plan: "BASIC",
      status: "active",
      billingCycle: "monthly",
      amount: "",
      currency: "USD",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      trialEndDate: "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "expired":
        return <AlertCircle className="w-4 h-4" />;
      case "trial":
        return <Calendar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const stats = {
    active: subscriptions.filter((s) => s.status === "active").length,
    trial: subscriptions.filter((s) => s.status === "trial").length,
    cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-8 h-8" />
            Subscription Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage church subscription plans and billing
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingSub ? "Edit Subscription" : "Add New Subscription"}
                </DialogTitle>
                <DialogDescription>
                  {editingSub
                    ? "Update church subscription details"
                    : "Create a new subscription for a church"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingSub && (
                  <div className="space-y-2">
                    <Label htmlFor="churchId">Church ID *</Label>
                    <Input
                      id="churchId"
                      value={formData.churchId}
                      onChange={(e) =>
                        setFormData({ ...formData, churchId: e.target.value })
                      }
                      required
                      placeholder="Enter church ID"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan *</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) =>
                        setFormData({ ...formData, plan: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select
                      value={formData.billingCycle}
                      onValueChange={(value) =>
                        setFormData({ ...formData, billingCycle: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trialEndDate">Trial End</Label>
                    <Input
                      id="trialEndDate"
                      type="date"
                      value={formData.trialEndDate}
                      onChange={(e) =>
                        setFormData({ ...formData, trialEndDate: e.target.value })
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
                    <>{editingSub ? "Update" : "Create"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.trial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            {subscriptions.length} subscription{subscriptions.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Church</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.church.name}</p>
                        {sub.church.email && (
                          <p className="text-xs text-gray-500">{sub.church.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[sub.plan]}>
                        {sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[sub.status]}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(sub.status)}
                          {sub.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.billingCycle || "—"}
                    </TableCell>
                    <TableCell>
                      {sub.amount ? (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {parseFloat(sub.amount).toFixed(2)} {sub.currency}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {sub.endDate
                        ? new Date(sub.endDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(sub)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
