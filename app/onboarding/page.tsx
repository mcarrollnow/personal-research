"use client"

import React from "react";
import { useState } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import BracketsIcon from "@/components/icons/brackets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { googleSheetsService } from "@/lib/google-sheets";

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    peptideType: "",
    startingWeight: "",
    goalWeight: "",
    heightFeet: "",
    heightInches: "",
    medicalConditions: "",
    medications: "",
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    const patientData = {
      name: formData.name,
      email: formData.email,
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      startDate: formData.startDate,
      peptideType: formData.peptideType,
      startingWeight: parseFloat(formData.startingWeight) || 0,
      goalWeight: parseFloat(formData.goalWeight) || 0,
      heightFeet: parseInt(formData.heightFeet) || 0,
      heightInches: parseInt(formData.heightInches) || 0,
      medicalConditions: formData.medicalConditions,
      medications: formData.medications,
      enrollmentDate: new Date().toISOString().split('T')[0]
    };

    const success = await googleSheetsService.submitData(patientData, 'patientProfiles');
    
    if (success) {
      // Redirect to dashboard or show success message
      console.log("Patient profile created successfully");
    }
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Patient Onboarding",
        description: "Welcome to the Study",
        icon: BracketsIcon,
      }}
    >
      {/* Welcome Message */}
      <DashboardCard
        title="WELCOME TO THE PEPTIDE INITIATIVE"
        intent="success"
        addon={<Badge variant="outline-warning">ENROLLMENT</Badge>}
      >
        <div className="bg-accent p-4 rounded-lg">
          <h4 className="font-display text-lg mb-2">REVOLUTIONARY RESEARCH</h4>
          <p className="text-sm text-muted-foreground mb-4">
            You're joining a groundbreaking study that will advance peptide therapy research. 
            Your data will help improve treatments for future patients worldwide.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-background rounded">
              <div className="font-display text-2xl text-primary">500+</div>
              <div className="text-xs text-muted-foreground">PARTICIPANTS</div>
            </div>
            <div className="p-3 bg-background rounded">
              <div className="font-display text-2xl text-primary">12</div>
              <div className="text-xs text-muted-foreground">PEPTIDES STUDIED</div>
            </div>
            <div className="p-3 bg-background rounded">
              <div className="font-display text-2xl text-primary">95%</div>
              <div className="text-xs text-muted-foreground">SUCCESS RATE</div>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Patient Information Form */}
      <DashboardCard
        title="PATIENT INFORMATION"
        intent="default"
        addon={<Badge variant="outline">REQUIRED</Badge>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-display text-lg mb-3">PERSONAL DETAILS</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="heightFeet" className="text-sm font-medium">Height (feet)</Label>
                  <Input
                    id="heightFeet"
                    type="number"
                    placeholder="5"
                    value={formData.heightFeet}
                    onChange={(e) => handleInputChange("heightFeet", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heightInches" className="text-sm font-medium">Height (inches)</Label>
                  <Input
                    id="heightInches"
                    type="number"
                    placeholder="8"
                    value={formData.heightInches}
                    onChange={(e) => handleInputChange("heightInches", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Study Information */}
          <div className="space-y-4">
            <h4 className="font-display text-lg mb-3">STUDY DETAILS</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="peptideType" className="text-sm font-medium">Peptide Type</Label>
                <Select value={formData.peptideType} onValueChange={(value) => handleInputChange("peptideType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select peptide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semaglutide">Semaglutide</SelectItem>
                    <SelectItem value="tirzepatide">Tirzepatide</SelectItem>
                    <SelectItem value="liraglutide">Liraglutide</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startingWeight" className="text-sm font-medium">Starting Weight (lbs)</Label>
                  <Input
                    id="startingWeight"
                    type="number"
                    step="0.1"
                    placeholder="Enter weight"
                    value={formData.startingWeight}
                    onChange={(e) => handleInputChange("startingWeight", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="goalWeight" className="text-sm font-medium">Goal Weight (lbs)</Label>
                  <Input
                    id="goalWeight"
                    type="number"
                    step="0.1"
                    placeholder="Enter goal"
                    value={formData.goalWeight}
                    onChange={(e) => handleInputChange("goalWeight", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">Study Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalConditions" className="text-sm font-medium">Medical Conditions</Label>
                <Textarea
                  id="medicalConditions"
                  placeholder="List any relevant medical conditions..."
                  value={formData.medicalConditions}
                  onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications" className="text-sm font-medium">Current Medications</Label>
                <Textarea
                  id="medications"
                  placeholder="List current medications..."
                  value={formData.medications}
                  onChange={(e) => handleInputChange("medications", e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={handleSubmit}>Complete Enrollment</Button>
        </div>
      </DashboardCard>

      {/* Study Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="success" />
              STUDY DURATION
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="text-2xl md:text-3xl font-display mb-2">20 WEEKS</div>
            <p className="text-sm text-muted-foreground">Complete study timeline</p>
            <ul className="text-sm mt-3 space-y-1">
              <li>• Weeks 1-4: Initial dose escalation</li>
              <li>• Weeks 5-16: Maintenance phase</li>
              <li>• Weeks 17-20: Data analysis</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              COMMITMENT
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="text-2xl md:text-3xl font-display mb-2">DAILY</div>
            <p className="text-sm text-muted-foreground">Data logging requirement</p>
            <ul className="text-sm mt-3 space-y-1">
              <li>• Daily weight and measurements</li>
              <li>• Weekly dose administration</li>
              <li>• Side effect monitoring</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
