"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, KeyRound, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset password state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccess(data.message || "Password updated successfully. You can now log in.");
        setShowReset(false);
        setEmail(resetEmail);
        setPassword("");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-3 sm:p-4 py-6">
      <div className="w-full max-w-md space-y-3 sm:space-y-4">
        {/* Quick link for students to check course fee status without login */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 sm:p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Student checking fee status?</span>
          </div>
          <Link href="/status" className="font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
            Check Status <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <Card className="shadow-lg border">
          <CardHeader className="text-center p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">IGBS Finance</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Islamische Gemeinschaft für Bildung und Soziales e.V., Hamburg</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-700 text-sm rounded-md">
                {success}
              </div>
            )}

            {!showReset ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="treasurer@igbs-hamburg.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReset(true);
                        setResetEmail(email);
                        setError("");
                        setSuccess("");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot / Reset Password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-1 border-b">
                  <KeyRound className="h-4 w-4 text-primary" /> Reset Password
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Your Registered Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="treasurer@igbs-hamburg.de"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2"
                    onClick={() => {
                      setShowReset(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="w-1/2" disabled={resetLoading}>
                    {resetLoading ? "Updating..." : "Save Password"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 border-t pt-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Staff Access:</p>
              <p>• Admin / Treasurer account registered in database</p>
              <p>• Students do not need passwords — visit <Link href="/status" className="text-primary underline">Student Status</Link></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
