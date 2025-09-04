import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import BracketsIcon from "@/components/icons/brackets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";

export default function InstructionsPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Instructions",
        description: "Getting Started Guide",
        icon: BracketsIcon,
      }}
    >
      {/* Welcome Section */}
      <DashboardCard
        title="WELCOME TO YOUR PEPTIDE JOURNEY"
        intent="success"
        addon={<Badge variant="outline-warning">IMPORTANT</Badge>}
      >
        <div className="space-y-4">
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome to the revolutionary peptide tracking platform. You are contributing to groundbreaking research 
            that will help advance peptide therapy for future patients.
          </p>
          <div className="bg-accent p-4 rounded-lg">
            <h4 className="font-display text-lg mb-2">YOUR CONTRIBUTION MATTERS</h4>
            <p className="text-sm text-muted-foreground">
              By tracking your progress, you're helping extend clinical trial reach and providing valuable data 
              for under-researched peptides.
            </p>
          </div>
        </div>
      </DashboardCard>

      {/* Quick Start Guide */}
      <DashboardCard
        title="QUICK START GUIDE"
        intent="default"
      >
        <div className="space-y-6">
          {[
            {
              step: "01",
              title: "LOG YOUR BASELINE",
              description: "Record your starting weight, measurements, and health metrics before beginning.",
              action: "Go to Log Results"
            },
            {
              step: "02", 
              title: "FOLLOW DOSING PROTOCOL",
              description: "Review your personalized dosing schedule and safety guidelines.",
              action: "View Dosing Instructions"
            },
            {
              step: "03",
              title: "TRACK DAILY PROGRESS",
              description: "Log daily metrics, side effects, and progress photos consistently.",
              action: "Monitor Progress"
            },
            {
              step: "04",
              title: "STAY SAFE",
              description: "Monitor for side effects and follow all safety protocols.",
              action: "Safety Guidelines"
            }
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4 p-4 bg-accent rounded-lg">
              <div className="flex items-center justify-center rounded bg-primary text-primary-foreground size-12 font-display text-xl">
                {item.step}
              </div>
              <div className="flex-1">
                <h4 className="font-display text-lg">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button variant="outline" size="sm">
                {item.action}
              </Button>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Important Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              SAFETY FIRST
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <ul className="space-y-2 text-sm">
              <li>• Always follow prescribed dosing protocols</li>
              <li>• Report any severe side effects immediately</li>
              <li>• Never exceed recommended dosages</li>
              <li>• Consult healthcare provider with concerns</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="success" />
              DATA ACCURACY
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <ul className="space-y-2 text-sm">
              <li>• Log data at consistent times daily</li>
              <li>• Use the same scale for weight measurements</li>
              <li>• Take photos in similar lighting/poses</li>
              <li>• Be honest about side effects and compliance</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
