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
import { patientAuthService } from "@/lib/patient-auth";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    patientId: ""
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
      const success = await patientAuthService.authenticatePatient(
        formData.email, 
        formData.patientId
      );

      if (success) {
        router.push("/"); // Redirect to dashboard
      } else {
        setError("Invalid email or patient ID. Please check your credentials.");
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
        title: "Patient Login",
        description: "Access Your Dashboard",
        icon: BracketsIcon,
      }}
    >
      {/* Welcome Message */}
      <DashboardCard
        title="WELCOME BACK"
        intent="default"
        addon={<Badge variant="outline">SECURE ACCESS</Badge>}
      >
        <div className="bg-accent p-4 rounded-lg text-center">
          <h4 className="font-display text-lg mb-2">PEPTIDE INITIATIVE DASHBOARD</h4>
          <p className="text-sm text-muted-foreground">
            Log in to access your personalized peptide tracking dashboard and contribute to revolutionary clinical research.
          </p>
        </div>
      </DashboardCard>

      {/* Login Form */}
      <DashboardCard
        title="PATIENT ACCESS"
        intent="default"
      >
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patientId" className="text-sm font-medium">Patient ID</Label>
              <Input
                id="patientId"
                placeholder="Enter your patient ID"
                value={formData.patientId}
                onChange={(e) => handleInputChange("patientId", e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button 
              onClick={handleLogin}
              disabled={loading || !formData.email || !formData.patientId}
              className="w-full"
            >
              {loading ? "Logging in..." : "Access Dashboard"}
            </Button>
          </div>
        </div>
      </DashboardCard>

      {/* Demo Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              DEMO PATIENT 1
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="space-y-2">
              <p className="text-sm"><strong>Email:</strong> john.smith@email.com</p>
              <p className="text-sm"><strong>Patient ID:</strong> PATIENT-001</p>
              <p className="text-sm text-muted-foreground">Semaglutide • 8 weeks progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="success" />
              DEMO PATIENT 2
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="space-y-2">
              <p className="text-sm"><strong>Email:</strong> sarah.j@email.com</p>
              <p className="text-sm"><strong>Patient ID:</strong> PATIENT-002</p>
              <p className="text-sm text-muted-foreground">Tirzepatide • 6 weeks progress</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
