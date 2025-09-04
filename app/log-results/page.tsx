"use client"

import React from "react";
import { useState } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import ProcessorIcon from "@/components/icons/proccesor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { googleSheetsService } from "@/lib/google-sheets";

export default function LogResultsPage() {
  const [formData, setFormData] = useState({
    weight: "",
    waistCircumference: "",
    hipCircumference: "",
    neckCircumference: "",
    energyLevel: "",
    appetiteLevel: "",
    sleepQuality: "",
    mood: "",
    sideEffects: "",
    doseTaken: "",
    doseTime: "",
    injectionSite: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Prepare data for Google Sheets
    const dailyLogData = {
      patientId: "PATIENT-001", // This would come from user authentication
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(formData.weight) || 0,
      waistCircumference: parseFloat(formData.waistCircumference) || 0,
      hipCircumference: parseFloat(formData.hipCircumference) || 0,
      neckCircumference: parseFloat(formData.neckCircumference) || 0,
      energyLevel: parseInt(formData.energyLevel) || 0,
      appetiteLevel: parseInt(formData.appetiteLevel) || 0,
      sleepQuality: parseInt(formData.sleepQuality) || 0,
      mood: parseInt(formData.mood) || 0,
      doseTaken: formData.doseTaken,
      doseTime: formData.doseTime,
      injectionSite: formData.injectionSite,
      sideEffects: formData.sideEffects,
      sideEffectSeverity: "none", // This would be determined from side effects
      notes: formData.notes,
      progressPhotoUrl: "" // This would come from photo upload
    };

    const success = await googleSheetsService.submitData(dailyLogData, 'dailyLogs');
    
    if (success) {
      // Reset form after successful submission
      setFormData({
        weight: "",
        waistCircumference: "",
        hipCircumference: "",
        neckCircumference: "",
        energyLevel: "",
        appetiteLevel: "",
        sleepQuality: "",
        mood: "",
        sideEffects: "",
        doseTaken: "",
        doseTime: "",
        injectionSite: "",
        notes: ""
      });
    }
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Log Results",
        description: `Today • ${new Date().toLocaleDateString()}`,
        icon: ProcessorIcon,
      }}
    >
      {/* Today's Entry */}
      <DashboardCard
        title="TODAY'S ENTRY"
        intent="default"
        addon={<Badge variant="outline">DAILY LOG</Badge>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weight & Measurements */}
          <div className="space-y-4">
            <h4 className="font-display text-lg mb-3">MEASUREMENTS</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium">Current Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="waist" className="text-sm font-medium">Waist Circumference (inches)</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  placeholder="Enter measurement"
                  value={formData.waistCircumference}
                  onChange={(e) => handleInputChange("waistCircumference", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hip" className="text-sm font-medium">Hip Circumference (inches)</Label>
                <Input
                  id="hip"
                  type="number"
                  step="0.1"
                  placeholder="Enter measurement"
                  value={formData.hipCircumference}
                  onChange={(e) => handleInputChange("hipCircumference", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neck" className="text-sm font-medium">Neck Circumference (inches)</Label>
                <Input
                  id="neck"
                  type="number"
                  step="0.1"
                  placeholder="Enter measurement"
                  value={formData.neckCircumference}
                  onChange={(e) => handleInputChange("neckCircumference", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Health Metrics */}
          <div className="space-y-4">
            <h4 className="font-display text-lg mb-3">HEALTH METRICS</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="energy" className="text-sm font-medium">Energy Level</Label>
                <Select value={formData.energyLevel} onValueChange={(value) => handleInputChange("energyLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select energy level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Low</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Moderate</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appetite" className="text-sm font-medium">Appetite Level</Label>
                <Select value={formData.appetiteLevel} onValueChange={(value) => handleInputChange("appetiteLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select appetite level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - No Appetite</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Normal</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleep" className="text-sm font-medium">Sleep Quality</Label>
                <Select value={formData.sleepQuality} onValueChange={(value) => handleInputChange("sleepQuality", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sleep quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Poor</SelectItem>
                    <SelectItem value="2">2 - Poor</SelectItem>
                    <SelectItem value="3">3 - Fair</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood" className="text-sm font-medium">Overall Mood</Label>
                <Select value={formData.mood} onValueChange={(value) => handleInputChange("mood", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Low</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Neutral</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dosing & Effects */}
          <div className="space-y-4">
            <h4 className="font-display text-lg mb-3">DOSING & EFFECTS</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="dose" className="text-sm font-medium">Dose Taken</Label>
                <Select value={formData.doseTaken} onValueChange={(value) => handleInputChange("doseTaken", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes - Full Dose</SelectItem>
                    <SelectItem value="partial">Partial Dose</SelectItem>
                    <SelectItem value="no">No - Missed Dose</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doseTime" className="text-sm font-medium">Dose Time</Label>
                <Input
                  id="doseTime"
                  type="time"
                  value={formData.doseTime}
                  onChange={(e) => handleInputChange("doseTime", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="injectionSite" className="text-sm font-medium">Injection Site</Label>
                <Select value={formData.injectionSite} onValueChange={(value) => handleInputChange("injectionSite", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select injection site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abdomen">Abdomen</SelectItem>
                    <SelectItem value="thigh">Thigh</SelectItem>
                    <SelectItem value="upperArm">Upper Arm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sideEffects" className="text-sm font-medium">Side Effects</Label>
                <Textarea
                  id="sideEffects"
                  placeholder="Any side effects experienced today?"
                  value={formData.sideEffects}
                  onChange={(e) => handleInputChange("sideEffects", e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="General observations, mood, appetite changes..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={handleSubmit}>Submit Entry</Button>
        </div>
      </DashboardCard>

      {/* Recent Entries */}
      <DashboardCard
        title="RECENT ENTRIES"
        intent="default"
        addon={<Badge variant="secondary">LAST 7 DAYS</Badge>}
      >
        <div className="space-y-3">
          {[
            { date: "Today", weight: "185.2 lbs", status: "Complete" },
            { date: "Yesterday", weight: "185.8 lbs", status: "Complete" },
            { date: "2 days ago", weight: "186.1 lbs", status: "Complete" },
            { date: "3 days ago", weight: "186.5 lbs", status: "Partial" },
            { date: "4 days ago", weight: "186.9 lbs", status: "Complete" }
          ].map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-accent rounded">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded bg-primary text-primary-foreground size-8 font-display text-sm">
                  {index + 1}
                </div>
                <div>
                  <span className="font-medium">{entry.date}</span>
                  <span className="text-muted-foreground text-sm ml-2">{entry.weight}</span>
                </div>
              </div>
              <Badge variant={entry.status === "Complete" ? "default" : "secondary"}>
                {entry.status}
              </Badge>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
