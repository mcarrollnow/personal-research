"use client"

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import BracketsIcon from "@/components/icons/brackets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { adminAuthService } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    adminId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    setError(""); // Clear error when user types
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const success = await adminAuthService.authenticateAdmin(
        formData.email, 
        formData.adminId
      );

      if (success) {
        router.push("/admin/dashboard"); // Redirect to admin dashboard
      } else {
        setError("Invalid email or admin ID. Please check your credentials.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Admin Login",
        description: "Clinical Research Administration",
        icon: BracketsIcon,
      }}
    >
      {/* Welcome Message */}
      <DashboardCard
        title="ADMIN ACCESS"
        intent="default"
        addon={<Badge variant="outline">SECURE PORTAL</Badge>}
      >
        <div className="bg-accent p-4 rounded-lg text-center">
          <h4 className="font-display text-lg mb-2">PEPTIDE INITIATIVE ADMIN</h4>
          <p className="text-sm text-muted-foreground">
            Access the administrative dashboard to manage patients, monitor progress, and provide clinical support.
          </p>
        </div>
      </DashboardCard>

      {/* Login Form */}
      <DashboardCard
        title="ADMINISTRATOR LOGIN"
        intent="default"
      >
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your admin email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminId" className="text-sm font-medium">Admin ID</Label>
              <Input
                id="adminId"
                placeholder="Enter your admin ID"
                value={formData.adminId}
                onChange={(e) => handleInputChange("adminId", e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button 
              onClick={handleLogin}
              disabled={loading || !formData.email || !formData.adminId}
              className="w-full"
            >
              {loading ? "Authenticating..." : "Access Admin Portal"}
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Demo Admin Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="success" />
              COORDINATOR
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="space-y-2">
              <p className="text-sm"><strong>Email:</strong> admin@clinic.com</p>
              <p className="text-sm"><strong>Admin ID:</strong> ADMIN-001</p>
              <p className="text-sm text-muted-foreground">Dr. Sarah Johnson • Clinical Research</p>
              <p className="text-xs text-muted-foreground">Full patient management access</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="warning" />
              SUPERVISOR
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="space-y-2">
              <p className="text-sm"><strong>Email:</strong> supervisor@clinic.com</p>
              <p className="text-sm"><strong>Admin ID:</strong> ADMIN-002</p>
              <p className="text-sm text-muted-foreground">Dr. Michael Chen • Medical Oversight</p>
              <p className="text-xs text-muted-foreground">Advanced admin permissions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              SUPPORT
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="space-y-2">
              <p className="text-sm"><strong>Email:</strong> support@clinic.com</p>
              <p className="text-sm"><strong>Admin ID:</strong> ADMIN-003</p>
              <p className="text-sm text-muted-foreground">Lisa Rodriguez • Patient Support</p>
              <p className="text-xs text-muted-foreground">Basic messaging support</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Return to Patient Login */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Not an administrator?</p>
        <Button 
          variant="outline" 
          onClick={() => router.push("/login")}
        >
          Patient Login
        </Button>
      </div>
    </DashboardPageLayout>
  );
}
