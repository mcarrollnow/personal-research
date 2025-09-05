"use client"

import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import CuteRobotIcon from "@/components/icons/cute-robot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { integrationService } from "@/lib/integration-service";
import { mobileOptimizationService, type MobileOptimization } from "@/lib/mobile-optimization";
import { patientAuthService } from "@/lib/patient-auth";

export default function SafetyPage() {
  const [checkedEffects, setCheckedEffects] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileOptimization, setMobileOptimization] = useState<MobileOptimization>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenSize: 'large',
    touchEnabled: false
  });

  useEffect(() => {
    // Initialize mobile optimization on client only
    mobileOptimizationService.initialize();
    setMobileOptimization(mobileOptimizationService.getCurrentOptimization());
    const unsubscribe = mobileOptimizationService.subscribe(setMobileOptimization);
    return unsubscribe;
  }, []);

  const handleEffectChange = (effect: string, checked: boolean) => {
    if (checked) {
      setCheckedEffects(prev => [...prev, effect]);
    } else {
      setCheckedEffects(prev => prev.filter(e => e !== effect));
    }
  };

  const handleReportSideEffect = async () => {
    if (checkedEffects.length === 0) {
      alert('Please select at least one side effect to report.');
      return;
    }

    setIsSubmitting(true);
    try {
      const patientId = patientAuthService.getCurrentPatientId() || 'PATIENT-001';
      await integrationService.processSafetyReport(patientId, checkedEffects, selectedSeverity);
      
      // Show success message
      alert(`Side effects reported successfully. ${selectedSeverity === 'severe' ? 'Emergency protocols have been activated and you will be contacted immediately.' : 'Your report has been sent to your care team.'}`);
      
      // Reset form
      setCheckedEffects([]);
      setSelectedSeverity('mild');
    } catch (error) {
      console.error('Error reporting side effects:', error);
      alert('Error reporting side effects. Please try again or contact support immediately if this is urgent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const touchOptimizations = mobileOptimizationService.getTouchOptimizations();
  const mobileClasses = mobileOptimizationService.getMobileSpecificClasses();

  return (
    <DashboardPageLayout
      header={{
        title: "Safety & Side Effects",
        description: "Monitor Your Health",
        icon: CuteRobotIcon,
      }}
    >
      {/* Safety Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="success" />
              SAFETY STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="text-2xl md:text-3xl font-display mb-2 text-success">GOOD</div>
            <p className="text-sm text-muted-foreground">No severe side effects</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              COMPLIANCE
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="text-2xl md:text-3xl font-display mb-2">95%</div>
            <p className="text-sm text-muted-foreground">Doses taken on time</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              LAST CHECK-IN
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="text-2xl md:text-3xl font-display mb-2">TODAY</div>
            <p className="text-sm text-muted-foreground">All systems monitored</p>
          </CardContent>
        </Card>
      </div>

      {/* Side Effects Tracker */}
      <DashboardCard
        title="SIDE EFFECTS TRACKER"
        intent="default"
        addon={<Badge variant="secondary">TODAY</Badge>}
        className="side-effects-section"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-display text-lg mb-4">COMMON SIDE EFFECTS</h4>
            <div className="space-y-3">
              {[
                "Nausea",
                "Vomiting", 
                "Diarrhea",
                "Constipation",
                "Abdominal pain",
                "Decreased appetite",
                "Fatigue",
                "Headache"
              ].map((effect) => (
                <div key={effect} className="flex items-center gap-3 p-2 rounded bg-accent">
                  <Checkbox
                    id={effect}
                    checked={checkedEffects.includes(effect)}
                    onCheckedChange={(checked) => handleEffectChange(effect, checked as boolean)}
                  />
                  <label htmlFor={effect} className="text-sm font-medium cursor-pointer flex-1">
                    {effect}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">SEVERITY LEVELS</h4>
            <div className="space-y-4">
              <div 
                className={`p-4 bg-accent rounded-lg cursor-pointer border-2 transition-colors ${
                  selectedSeverity === 'mild' ? 'border-success bg-success/10' : 'border-transparent'
                }`}
                onClick={() => setSelectedSeverity('mild')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="font-medium">MILD</span>
                  {selectedSeverity === 'mild' && <span className="ml-auto text-success">✓</span>}
                </div>
                <p className="text-sm text-muted-foreground">Minimal impact on daily activities</p>
              </div>
              
              <div 
                className={`p-4 bg-accent rounded-lg cursor-pointer border-2 transition-colors ${
                  selectedSeverity === 'moderate' ? 'border-warning bg-warning/10' : 'border-transparent'
                }`}
                onClick={() => setSelectedSeverity('moderate')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="font-medium">MODERATE</span>
                  {selectedSeverity === 'moderate' && <span className="ml-auto text-warning">✓</span>}
                </div>
                <p className="text-sm text-muted-foreground">Some interference with activities</p>
              </div>
              
              <div 
                className={`p-4 bg-accent rounded-lg cursor-pointer border-2 transition-colors ${
                  selectedSeverity === 'severe' ? 'border-destructive bg-destructive/10' : 'border-transparent'
                }`}
                onClick={() => setSelectedSeverity('severe')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="font-medium">SEVERE</span>
                  {selectedSeverity === 'severe' && <span className="ml-auto text-destructive">✓</span>}
                </div>
                <p className="text-sm text-muted-foreground">Significant impact - contact provider immediately</p>
              </div>
            </div>

            {checkedEffects.length > 0 && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <h5 className="font-medium mb-2">Selected Side Effects ({checkedEffects.length}):</h5>
                <div className="flex flex-wrap gap-2">
                  {checkedEffects.map((effect) => (
                    <Badge key={effect} variant="secondary">
                      {effect}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={handleReportSideEffect}
                  disabled={isSubmitting}
                  className={`w-full mt-4 ${touchOptimizations.buttonSize} ${touchOptimizations.fontSize}`}
                  variant={selectedSeverity === 'severe' ? 'destructive' : 'default'}
                >
                  {isSubmitting ? 'Reporting...' : `Report ${selectedSeverity.toUpperCase()} Side Effects`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DashboardCard>

      {/* Emergency Contact */}
      <DashboardCard
        title="EMERGENCY PROTOCOLS"
        intent="default"
        addon={<Badge variant="destructive">URGENT</Badge>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-display text-lg">CONTACT IMMEDIATELY IF:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                Severe allergic reactions (swelling, difficulty breathing)
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                Persistent vomiting preventing hydration
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                Severe abdominal pain
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                Signs of pancreatitis
              </li>
            </ul>
          </div>

          <div className="bg-accent p-4 rounded-lg">
            <h4 className="font-display text-lg mb-4">EMERGENCY CONTACTS</h4>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Study Coordinator</p>
                <p className="text-sm text-muted-foreground">(555) 123-4567</p>
              </div>
              <div>
                <p className="font-medium">After Hours Emergency</p>
                <p className="text-sm text-muted-foreground">(555) 987-6543</p>
              </div>
              <Button 
                variant="destructive" 
                className={`w-full mt-4 ${touchOptimizations.buttonSize} ${touchOptimizations.fontSize}`}
                onClick={() => {
                  setSelectedSeverity('severe');
                  // Auto-scroll to side effects section on mobile
                  if (mobileOptimization.isMobile) {
                    document.querySelector('.side-effects-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                REPORT SEVERE SIDE EFFECT
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
