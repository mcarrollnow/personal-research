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
import { dashboardDataService } from "@/lib/dashboard-data";
import { patientAuthService } from "@/lib/patient-auth";
import { integrationService } from "@/lib/integration-service";
import { mobileOptimizationService, type MobileOptimization } from "@/lib/mobile-optimization";
import { useEffect } from "react";

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

  const [recentEntries, setRecentEntries] = useState([
    { date: "Today", weight: "185.2 lbs", status: "Complete" },
    { date: "Yesterday", weight: "185.8 lbs", status: "Complete" },
    { date: "2 days ago", weight: "186.1 lbs", status: "Complete" },
    { date: "3 days ago", weight: "186.5 lbs", status: "Partial" },
    { date: "4 days ago", weight: "186.9 lbs", status: "Complete" }
  ]);
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([]);
  const [complianceRate, setComplianceRate] = useState<number>(0);
  const [mobileOptimization, setMobileOptimization] = useState<MobileOptimization>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenSize: 'large',
    touchEnabled: false
  });

  // Fetch real recent entries and check compliance on component mount
  useEffect(() => {
    // Initialize mobile optimization on client only
    mobileOptimizationService.initialize();
    setMobileOptimization(mobileOptimizationService.getCurrentOptimization());
    const unsubscribe = mobileOptimizationService.subscribe(setMobileOptimization);
    
    const fetchRecentEntries = async () => {
      try {
        const entries = await dashboardDataService.getRecentEntries();
        if (entries.length > 0) {
          setRecentEntries(entries);
        }
      } catch (error) {
        console.error('Error fetching recent entries:', error);
      }
    };

    const checkCompliance = async () => {
      try {
        const patientId = patientAuthService.getCurrentPatientId() || 'PATIENT-001';
        // Only check compliance on client-side to avoid hydration issues
        if (typeof window !== 'undefined') {
          const alerts = await integrationService.checkComplianceAlerts(patientId);
          setComplianceAlerts(alerts);
          
          const rate = await integrationService.getComplianceRate(patientId);
          setComplianceRate(rate);
        }
      } catch (error) {
        console.error('Error checking compliance:', error);
      }
    };

    fetchRecentEntries();
    checkCompliance();
    
    return unsubscribe;
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Prepare data for Google Sheets
    const patientId = patientAuthService.getCurrentPatientId() || "PATIENT-001";
    const dailyLogData = {
      patientId: patientId,
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
      // Check for progress milestones after successful submission
      const currentWeight = parseFloat(formData.weight);
      if (currentWeight > 0) {
        try {
          await integrationService.checkProgressMilestones(patientId, currentWeight, 8); // Week 8 as example
        } catch (error) {
          console.error('Error checking milestones:', error);
        }
      }
      
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

  // Use static layouts until client hydration to avoid hydration mismatch
  const touchOptimizations = mobileOptimizationService.getTouchOptimizations();
  const mobileLayout = {
    gridClass: 'grid grid-cols-1 lg:grid-cols-2 gap-6', // Static responsive grid
    cardClass: 'p-6 rounded-lg border bg-card text-card-foreground shadow-sm',
    statsClass: 'grid grid-cols-1 md:grid-cols-3 gap-6',
    chartClass: 'h-96 w-full'
  };
  const mobileClasses = mobileOptimizationService.getMobileSpecificClasses();

  return (
    <DashboardPageLayout
      header={{
        title: "Log Results",
        description: `Today • ${new Date().toLocaleDateString()}`,
        icon: ProcessorIcon,
      }}
    >
      {/* Compliance Alerts */}
      {complianceAlerts.length > 0 && (
        <DashboardCard
          title="📊 COMPLIANCE REMINDERS"
          intent="default"
          addon={<Badge variant="destructive">{complianceAlerts.length} Alert{complianceAlerts.length > 1 ? 's' : ''}</Badge>}
        >
          <div className="space-y-3">
            {complianceAlerts.map((alert, index) => (
              <div key={alert.id} className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <div className="flex items-start gap-2">
                  <div className="text-lg">⚠️</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-warning mb-1">
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {alert.type === 'missed_dose' && `Haven't logged doses for ${alert.daysCount} days`}
                      {alert.type === 'incomplete_log' && `Haven't logged complete measurements for ${alert.daysCount} days`}
                      {alert.type === 'low_compliance' && `Compliance rate needs improvement`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A follow-up message has been sent to help you get back on track! 💪
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Compliance Stats */}
      <div className={mobileLayout.gridClass + " mb-6"}>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant={complianceRate >= 80 ? "success" : complianceRate >= 60 ? "warning" : "destructive"} />
              COMPLIANCE RATE
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className={`text-2xl md:text-3xl font-display mb-2 ${
              complianceRate >= 80 ? 'text-success' : 
              complianceRate >= 60 ? 'text-warning' : 
              'text-destructive'
            }`}>
              {Math.round(complianceRate)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {complianceRate >= 80 ? 'Excellent tracking!' : 
               complianceRate >= 60 ? 'Good - keep improving' : 
               'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              STREAK
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="text-2xl md:text-3xl font-display mb-2">5</div>
            <p className="text-sm text-muted-foreground">Days logged consistently</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              NEXT GOAL
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="text-2xl md:text-3xl font-display mb-2">7</div>
            <p className="text-sm text-muted-foreground">Days for weekly streak</p>
          </CardContent>
        </Card>
      </div>

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
          <Button variant="outline" className={`${touchOptimizations.buttonSize} ${touchOptimizations.fontSize}`}>
            Save Draft
          </Button>
          <Button 
            onClick={handleSubmit}
            className={`${touchOptimizations.buttonSize} ${touchOptimizations.fontSize}`}
          >
            Submit Entry
          </Button>
        </div>
      </DashboardCard>

      {/* Recent Entries */}
      <DashboardCard
        title="RECENT ENTRIES"
        intent="default"
        addon={<Badge variant="secondary">LAST 7 DAYS</Badge>}
      >
        <div className="space-y-3">
          {recentEntries.map((entry, index) => (
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
