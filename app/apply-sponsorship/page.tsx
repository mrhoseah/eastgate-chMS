"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, Church } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ApplySponsorshipPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    churchName: "",
    denomination: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    website: "",
    memberCount: "",
    reason: "",
  });

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setError("No application token provided");
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await fetch(`/api/sponsorship/apply?token=${token}`);
      const data = await res.json();

      if (data.valid) {
        setValidToken(true);
        if (data.alreadySubmitted) {
          setSubmitted(true);
        }
      } else {
        setError(data.error || "Invalid or expired token");
      }
    } catch (err) {
      setError("Failed to verify application token");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sponsorship/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...formData,
          memberCount: formData.memberCount ? parseInt(formData.memberCount) : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit application");
      }
    } catch (err) {
      setError("An error occurred while submitting your application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/10 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-2 shadow-xl">
          <CardContent className="pt-6 text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Verifying application token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50/30 to-yellow-50/30 dark:from-gray-950 dark:via-red-950/10 dark:to-orange-950/10 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-2 border-red-200 dark:border-red-900/50 shadow-xl">
          <CardContent className="pt-6 text-center py-12">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Token</h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please contact the church administrator for a valid application link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-green-950/10 dark:to-emerald-950/10 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-2 border-green-200 dark:border-green-900/50 shadow-xl">
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for applying for church sponsorship. Your application has been received
              and will be reviewed by our team.
            </p>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>What happens next?</strong>
                <br />
                Our team will review your application and contact you at the email address
                provided. This typically takes 2-3 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/10 p-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg mx-auto mb-4">
            <Church className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Church Sponsorship Application
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Complete the form below to apply for church management system sponsorship
          </p>
        </div>

        <Card className="border-2 border-blue-100 dark:border-blue-900/50 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b-2 border-gray-100 dark:border-gray-800">
            <CardTitle className="text-2xl">Application Details</CardTitle>
            <CardDescription>
              Please provide accurate information about your church
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Church Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b-2 border-blue-200 dark:border-blue-800 pb-2">
                  Church Information
                </h3>

                <div>
                  <Label htmlFor="churchName" className="text-base">
                    Church Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="churchName"
                    required
                    value={formData.churchName}
                    onChange={(e) => handleChange("churchName", e.target.value)}
                    placeholder="e.g., Grace Community Church"
                    className="border-2 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="denomination" className="text-base">
                    Denomination
                  </Label>
                  <Input
                    id="denomination"
                    value={formData.denomination}
                    onChange={(e) => handleChange("denomination", e.target.value)}
                    placeholder="e.g., Non-denominational, Baptist, Methodist"
                    className="border-2 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="memberCount" className="text-base">
                    Approximate Member Count
                  </Label>
                  <Input
                    id="memberCount"
                    type="number"
                    value={formData.memberCount}
                    onChange={(e) => handleChange("memberCount", e.target.value)}
                    placeholder="e.g., 150"
                    className="border-2 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-base">
                    Church Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://www.yourchurch.org"
                    className="border-2 mt-1"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b-2 border-purple-200 dark:border-purple-800 pb-2">
                  Contact Information
                </h3>

                <div>
                  <Label htmlFor="contactName" className="text-base">
                    Contact Person Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={(e) => handleChange("contactName", e.target.value)}
                    placeholder="Full name of primary contact"
                    className="border-2 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail" className="text-base">
                    Contact Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    placeholder="email@example.com"
                    className="border-2 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone" className="text-base">
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="border-2 mt-1"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b-2 border-indigo-200 dark:border-indigo-800 pb-2">
                  Location
                </h3>

                <div>
                  <Label htmlFor="address" className="text-base">
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="123 Church Street"
                    className="border-2 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-base">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="City name"
                      className="border-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-base">
                      State/Province
                    </Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      placeholder="State or province"
                      className="border-2 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country" className="text-base">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="country"
                      required
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      placeholder="Country name"
                      className="border-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-base">
                      ZIP/Postal Code
                    </Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleChange("zipCode", e.target.value)}
                      placeholder="12345"
                      className="border-2 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Reason for Application */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b-2 border-green-200 dark:border-green-800 pb-2">
                  Application Reason
                </h3>

                <div>
                  <Label htmlFor="reason" className="text-base">
                    Why is your church applying for sponsorship?{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    required
                    value={formData.reason}
                    onChange={(e) => handleChange("reason", e.target.value)}
                    placeholder="Please explain why you're seeking sponsorship for our church management system. Include information about your church's mission, financial situation, and how this system would benefit your ministry."
                    rows={6}
                    className="border-2 mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum 50 characters</p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By submitting this application, you acknowledge that the information provided is
                accurate and that you have the authority to apply on behalf of your church.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
