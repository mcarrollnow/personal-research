import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import AtomIcon from "@/components/icons/atom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";

export default function DosingPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Dosing Instructions",
        description: "Personalized Protocol",
        icon: AtomIcon,
      }}
    >
      {/* Current Protocol */}
      <DashboardCard
        title="YOUR CURRENT PROTOCOL"
        intent="success"
        addon={<Badge variant="outline-warning">ACTIVE</Badge>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <Bullet variant="success" />
                PEPTIDE TYPE
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
              <div className="text-2xl md:text-3xl font-display mb-2">SEMAGLUTIDE</div>
              <p className="text-sm text-muted-foreground">GLP-1 Receptor Agonist</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <Bullet variant="default" />
                CURRENT DOSE
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
              <div className="text-2xl md:text-3xl font-display mb-2">0.5 MG</div>
              <p className="text-sm text-muted-foreground">Weekly injection</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <Bullet variant="default" />
                NEXT DOSE
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
              <div className="text-2xl md:text-3xl font-display mb-2">FRIDAY</div>
              <p className="text-sm text-muted-foreground">2 days remaining</p>
            </CardContent>
          </Card>
        </div>
      </DashboardCard>

      {/* Dosing Schedule */}
      <DashboardCard
        title="DOSING SCHEDULE"
        intent="default"
      >
        <div className="space-y-4">
          {[
            { week: "Week 1-4", dose: "0.25 mg", status: "Complete", color: "bg-success" },
            { week: "Week 5-8", dose: "0.5 mg", status: "Current", color: "bg-primary" },
            { week: "Week 9-12", dose: "1.0 mg", status: "Upcoming", color: "bg-muted" },
            { week: "Week 13-16", dose: "1.7 mg", status: "Upcoming", color: "bg-muted" },
            { week: "Week 17-20", dose: "2.4 mg", status: "Upcoming", color: "bg-muted" }
          ].map((phase, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-accent rounded-lg">
              <div className={`w-4 h-4 rounded-full ${phase.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg">{phase.week}</span>
                  <span className="font-display text-xl">{phase.dose}</span>
                </div>
                <p className="text-sm text-muted-foreground">Status: {phase.status}</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Administration Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              INJECTION TECHNIQUE
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded bg-primary text-primary-foreground size-6 font-display text-sm mt-0.5">1</div>
                <p className="text-sm">Rotate injection sites (abdomen, thigh, upper arm)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded bg-primary text-primary-foreground size-6 font-display text-sm mt-0.5">2</div>
                <p className="text-sm">Clean injection site with alcohol swab</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded bg-primary text-primary-foreground size-6 font-display text-sm mt-0.5">3</div>
                <p className="text-sm">Inject at 90° angle, hold for 10 seconds</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded bg-primary text-primary-foreground size-6 font-display text-sm mt-0.5">4</div>
                <p className="text-sm">Dispose of needle safely</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5">
              <Bullet variant="default" />
              TIMING & STORAGE
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-accent flex-1 pt-2 md:pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Best Time to Inject</h4>
                <p className="text-sm text-muted-foreground">Same day each week, preferably morning</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Storage</h4>
                <p className="text-sm text-muted-foreground">Refrigerate at 36-46°F (2-8°C)</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Missed Dose</h4>
                <p className="text-sm text-muted-foreground">Take within 5 days, then resume normal schedule</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
