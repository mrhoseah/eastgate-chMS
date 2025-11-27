"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, Mail, Loader2, CheckCircle2, XCircle, Heart, ArrowRight, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Format phone number for M-Pesa (254XXXXXXXXX)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

// Validate phone number
function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return /^254\d{9}$/.test(formatted);
}

// Validate email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type SupportedPaymentMethod = "MPESA" | "PAYPAL" | "BANK_TRANSFER";

interface PaymentOption {
  method: SupportedPaymentMethod;
  label: string;
  currency: string;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  swiftCode?: string;
  currency: string;
  instructions?: string;
              {/* Contact Information */}
              {paymentMethod === "MPESA" && (
                <div>
                  <Label htmlFor="phone" className="mb-2 block flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    M-Pesa Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                  {userPhone && userPhone !== phoneNumber && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs mt-2"
                      onClick={() => setPhoneNumber(userPhone)}
                    >
                      Use my registered number ({userPhone})
                    </Button>
                  )}
                  {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid Kenyan phone number
                    </p>
                  )}
                  {mpesaDetails && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-200">
                      Prefer paybill? Use business number <strong>{mpesaDetails.paybillNumber || "[paybill]"}</strong> and account <strong>{mpesaDetails.paybillAccountName || "[account]"}</strong>.
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "PAYPAL" && (
                <div>
                  <Label htmlFor="email" className="mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                  {userEmail && userEmail !== email && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs mt-2"
                      onClick={() => setEmail(userEmail)}
                    >
                      Use my registered email ({userEmail})
                    </Button>
                  )}
                  {email && !isValidEmail(email) && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                  )}
                </div>
              )}

              {paymentMethod === "BANK_TRANSFER" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bankDepositor" className="mb-2 block">Depositor Name</Label>
                    <Input
                      id="bankDepositor"
                      value={bankDepositorName}
                      onChange={(e) => setBankDepositorName(e.target.value)}
                      placeholder="Name appearing on the transfer"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankEmail" className="mb-2 block">Confirmation Email</Label>
                    <Input
                      id="bankEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="h-12"
                    />
                    {email && !isValidEmail(email) && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bankReference" className="mb-2 block">Transfer Reference (optional)</Label>
                    <Input
                      id="bankReference"
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      placeholder="e.g., EFT12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankNotes" className="mb-2 block">Notes to Finance (optional)</Label>
                    <Textarea
                      id="bankNotes"
                      rows={3}
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                      placeholder="Add any pledge notes or instructions"
                    />
                  </div>
                  {bankDetails ? (
                    <div className="p-4 border rounded-lg text-sm space-y-1 bg-white dark:bg-gray-900">
                      <p className="font-semibold flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Bank Transfer Details
                      </p>
                      <p>{bankDetails.bankName}{bankDetails.branch ? ` — ${bankDetails.branch}` : ""}</p>
                      <p>Account Name: <strong>{bankDetails.accountName}</strong></p>
                      <p>Account Number: <strong>{bankDetails.accountNumber}</strong></p>
                      {bankDetails.swiftCode && <p>SWIFT: <strong>{bankDetails.swiftCode}</strong></p>}
                      <p>Currency: {bankDetails.currency}</p>
                      {bankDetails.instructions && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">{bankDetails.instructions}</p>
                      )}
                      {bankDetails.contactEmail && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Questions? Email {bankDetails.contactEmail}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-700 rounded text-sm">
                      Bank transfer details are loading. Please try again.
                    </div>
                  )}
                </div>
              )}
        const data = await res.json();
        const available: PaymentOption[] = (data.methods || [])
          .filter((method: any) => method.enabled)
          .map((method: any) => ({
            method: method.method,
            label: method.label,
            currency: method.currency,
          }));
        setPaymentOptions(available);
  const isBankTransfer = paymentMethod === "BANK_TRANSFER";
  const currencyCode = currentMethod?.currency?.toUpperCase?.() || (isPayPal ? "USD" : "KES");
  const currencyPrefix = isPayPal ? "$" : currencyCode;
  const minAmount = isPayPal ? 1 : 100;
  const maxAmount = isPayPal ? 100000 : 1000000;

  const handleSelectMethod = (method: SupportedPaymentMethod) => {
    setPaymentMethod(method);
    if (method === "PAYPAL") {
      setAmount(10);
    } else {
      setAmount(1000);
    }
  };

  const getPresetAmounts = () => {
    if (paymentMethod === "PAYPAL") {
      return paypalAmounts;
    }
    return mpesaAmounts;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      toast({
        title: "No payment methods",
        description: "A giving method is not available yet. Please contact the church administrator.",
        variant: "destructive",
      });
      return;
    }
    
    // Validation
    if (paymentMethod === "MPESA") {
      if (!phoneNumber) {
        toast({
          title: "Phone number required",
          description: "Please enter your M-Pesa phone number",
          variant: "destructive",
        });
        return;
      }
      if (!isValidPhoneNumber(phoneNumber)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid Kenyan phone number (e.g., 0712 345 678)",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === "PAYPAL") {
      if (!email) {
        toast({
          title: "Email required",
          description: "Please enter your email address",
          variant: "destructive",
        });
        return;
      }
      if (!isValidEmail(email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === "BANK_TRANSFER") {
      if (!bankDetails) {
        toast({
          title: "Bank transfers disabled",
          description: "The finance team has not finished configuring bank transfers.",
          variant: "destructive",
        });
        return;
      }
      if (!bankDepositorName.trim()) {
        toast({
          title: "Depositor name required",
          description: "Let us know who is making the transfer so we can reconcile it quickly.",
          variant: "destructive",
        });
        return;
      }
      if (!email) {
        toast({
          title: "Email required",
          description: "Please enter your email address",
          variant: "destructive",
        });
        return;
      }
      if (!isValidEmail(email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (paymentMethod === "MPESA") {
        // M-Pesa STK Push
        const formattedPhone = formatPhoneNumber(phoneNumber);
        const response = await fetch("/api/donations/mpesa-stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            amount: amount,
            category: category,
            userId: (session?.user as any)?.id || null,
            groupId: selectedGroupId || null,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast({
            title: "Payment request sent!",
            description: "Please check your phone and enter your M-Pesa PIN to complete the payment.",
          });
          // Store phone for next time
          localStorage.setItem("last_used_phone", phoneNumber);
          // Reset form
          setAmount(1000);
          setPhoneNumber("");
        } else {
          toast({
            title: "Payment failed",
            description: data.error || "Failed to initiate payment. Please try again.",
            variant: "destructive",
          });
        }
      } else if (paymentMethod === "PAYPAL") {
        // PayPal payment
        const response = await fetch("/api/donations/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            category: category,
            email: email,
            userId: (session?.user as any)?.id || null,
            groupId: selectedGroupId || null,
          }),
        });

        const data = await response.json();

        if (response.ok && data.approvalUrl) {
          // Redirect to PayPal
          window.location.href = data.approvalUrl;
        } else {
          toast({
            title: "Payment failed",
            description: data.error || "Failed to initiate PayPal payment. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        const response = await fetch("/api/donations/bank-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            category,
            donorName: bankDepositorName,
            email,
            reference: bankReference,
            notes: transferNotes,
            groupId: selectedGroupId || null,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast({
            title: "Transfer logged",
            description: "Please complete the bank transfer using the displayed details. We'll update you once it clears.",
          });
          setBankDepositorName("");
          setBankReference("");
          setTransferNotes("");
        } else {
          toast({
            title: "Unable to log transfer",
            description: data.error || "Please try again or contact finance.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Give to Eastgate Chapel
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your generosity makes a difference
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-2 border-blue-100 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-2xl">Make a Donation</CardTitle>
            <CardDescription>
              Choose your amount and payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[3rem]">
                {methodsLoading ? (
                  <div className="w-full h-10 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ) : paymentOptions.length === 0 ? (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center w-full">
                    No payment methods are active yet. Please ask the church admin to configure giving.
                  </p>
                ) : (
                  paymentOptions.map((option) => {
                    const Icon = option.method === "PAYPAL" ? Mail : option.method === "BANK_TRANSFER" ? Landmark : Smartphone;
                    return (
                      <Button
                        key={option.method}
                        type="button"
                        variant={paymentMethod === option.method ? "default" : "ghost"}
                        className="flex-1"
                        onClick={() => handleSelectMethod(option.method)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {option.label}
                      </Button>
                    );
                  })
                )}
              </div>

              {/* Amount Selection */}
              <div>
                <Label className="mb-3 block text-sm font-semibold">Amount</Label>
                {paymentMethod ? (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                      {getPresetAmounts().map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={amount === preset ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAmount(preset)}
                          className="font-semibold"
                        >
                          {isPayPal ? (
                            <>${preset}</>
                          ) : (
                            <>KES {preset >= 1000 ? `${preset / 1000}K` : preset}</>
                          )}
                        </Button>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                        {currencyPrefix}
                      </div>
                      <Input
                        type="number"
                        min={minAmount}
                        max={maxAmount}
                        step={isPayPal ? 1 : 100}
                        value={amount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || minAmount;
                          setAmount(Math.max(minAmount, Math.min(maxAmount, value)));
                        }}
                        className="pl-16 text-lg font-semibold h-14"
                        placeholder="Enter amount"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Select a payment method to enter an amount.</p>
                )}
              </div>

              {/* Group Selection (if user is member of groups with giving enabled) */}
              {userGroups.length > 0 && (
                <div>
                  <Label htmlFor="group" className="mb-2 block">Group (Optional)</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger id="group" className="h-12">
                      <SelectValue placeholder="Select a group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No group</SelectItem>
                      {userGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Associate this donation with a group
                  </p>
                </div>
              )}

              {/* Category */}
              <div>
                <Label htmlFor="category" className="mb-2 block">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              {paymentMethod === "MPESA" ? (
                <div>
                  <Label htmlFor="phone" className="mb-2 block flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    M-Pesa Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                  {userPhone && userPhone !== phoneNumber && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs mt-2"
                      onClick={() => setPhoneNumber(userPhone)}
                    >
                      Use my registered number ({userPhone})
                    </Button>
                  )}
                  {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid Kenyan phone number
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="email" className="mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                  {userEmail && userEmail !== email && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs mt-2"
                      onClick={() => setEmail(userEmail)}
                    >
                      Use my registered email ({userEmail})
                    </Button>
                  )}
                  {email && !isValidEmail(email) && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !paymentMethod}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === "MPESA" && (
                      <>
                        <Smartphone className="w-5 h-5 mr-2" />
                        Pay with M-Pesa
                      </>
                    )}
                    {paymentMethod === "PAYPAL" && (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Continue to PayPal
                      </>
                    )}
                    {paymentMethod === "BANK_TRANSFER" && (
                      <>
                        <Landmark className="w-5 h-5 mr-2" />
                        Log Bank Transfer
                      </>
                    )}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">1</span>
                </div>
                <h3 className="font-semibold mb-2">Choose Amount</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a preset amount or enter your own
                </p>
              </div>
              <div>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">2</span>
                </div>
                <h3 className="font-semibold mb-2">Enter Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select category and enter your contact information
                </p>
              </div>
              <div>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">3</span>
                </div>
                <h3 className="font-semibold mb-2">Complete Payment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Follow the prompts to complete your donation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
