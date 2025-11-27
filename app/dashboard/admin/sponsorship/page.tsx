"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Link2, CheckCircle, XCircle, Clock, Copy, Infinity, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SponsorshipManagementPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({
    action: "approve",
    periodDays: "365",
    isUnlimited: false,
    notes: "",
    rejectionReason: "",
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sponsorship/applications?status=submitted");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sponsorship/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedLink(data.applicationUrl);
        alert("Application link generated successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to generate link");
      }
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to generate application link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      alert("Link copied to clipboard!");
    }
  };

  const handleReview = async () => {
    if (!selectedApplication) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/sponsorship/applications/${selectedApplication.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reviewForm),
        }
      );

      if (res.ok) {
        alert(
          reviewForm.action === "approve"
            ? "Application approved and church created!"
            : "Application rejected"
        );
        setReviewDialogOpen(false);
        fetchApplications();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to review application");
      }
    } catch (error) {
      console.error("Error reviewing application:", error);
      alert("Failed to review application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/10 p-6 sm:p-8 lg:p-10 space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-5 dark:opacity-10"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-blue-100 dark:border-blue-900/50 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Link2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sponsorship Management
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Manage church sponsorship applications
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800 p-2">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <TabsTrigger
              value="generate"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Generate Link
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Clock className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Generate Link Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card className="border-2 border-blue-100 dark:border-blue-900/50 shadow-xl rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b-2 border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Generate Application Link
                </span>
              </CardTitle>
              <CardDescription className="mt-2">
                Create a unique application link for churches to apply for sponsorship
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col gap-4">
                <Button
                  onClick={generateLink}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {loading ? "Generating..." : "Generate New Application Link"}
                </Button>

                {generatedLink && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 space-y-4">
                    <Label className="text-lg font-bold">Generated Link:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={generatedLink}
                        readOnly
                        className="font-mono text-sm border-2"
                      />
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="border-2 hover:border-blue-400"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share this link with churches that want to apply for sponsorship
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card className="border-2 border-indigo-100 dark:border-indigo-900/50 shadow-xl rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b-2 border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Sponsorship Applications
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No applications found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                      <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                        <TableHead className="font-bold">Church Name</TableHead>
                        <TableHead className="font-bold">Contact</TableHead>
                        <TableHead className="font-bold">Location</TableHead>
                        <TableHead className="font-bold">Members</TableHead>
                        <TableHead className="font-bold">Submitted</TableHead>
                        <TableHead className="font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                          <TableCell className="font-semibold">{app.churchName}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{app.contactName}</p>
                              <p className="text-sm text-gray-500">{app.contactEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {app.city}, {app.country}
                          </TableCell>
                          <TableCell>{app.memberCount || "N/A"}</TableCell>
                          <TableCell>
                            {app.submittedAt
                              ? new Date(app.submittedAt).toLocaleDateString()
                              : "Not submitted"}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => {
                                setSelectedApplication(app);
                                setReviewDialogOpen(true);
                              }}
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Review Application
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                <h3 className="font-bold text-lg">{selectedApplication.churchName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedApplication.contactName} • {selectedApplication.contactEmail}
                </p>
                {selectedApplication.contactPhone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedApplication.contactPhone}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-bold">Reason for Application:</Label>
                <p className="mt-2 text-sm">{selectedApplication.reason}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Action</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => setReviewForm({ ...reviewForm, action: "approve" })}
                      variant={reviewForm.action === "approve" ? "default" : "outline"}
                      className={
                        reviewForm.action === "approve"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setReviewForm({ ...reviewForm, action: "reject" })}
                      variant={reviewForm.action === "reject" ? "destructive" : "outline"}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>

                {reviewForm.action === "approve" && (
                  <>
                    <div>
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reviewForm.isUnlimited}
                          onChange={(e) =>
                            setReviewForm({ ...reviewForm, isUnlimited: e.target.checked })
                          }
                          className="w-4 h-4"
                        />
                        Unlimited Sponsorship
                        <Infinity className="w-4 h-4 text-purple-600" />
                      </Label>
                    </div>

                    {!reviewForm.isUnlimited && (
                      <div>
                        <Label>Sponsorship Period (Days)</Label>
                        <Input
                          type="number"
                          value={reviewForm.periodDays}
                          onChange={(e) =>
                            setReviewForm({ ...reviewForm, periodDays: e.target.value })
                          }
                          placeholder="e.g., 365"
                        />
                      </div>
                    )}
                  </>
                )}

                {reviewForm.action === "reject" && (
                  <div>
                    <Label>Rejection Reason</Label>
                    <Textarea
                      value={reviewForm.rejectionReason}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, rejectionReason: e.target.value })
                      }
                      placeholder="Explain why the application is being rejected..."
                    />
                  </div>
                )}

                <div>
                  <Label>Admin Notes (Optional)</Label>
                  <Textarea
                    value={reviewForm.notes}
                    onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                    placeholder="Internal notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? "Processing..." : "Submit Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
