import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import DashboardChart from "@/components/dashboard/chart";
import EmailIcon from "@/components/icons/email";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import BoomIcon from "@/components/icons/boom";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";

export default function ProgressPage() {
  // Mock progress data - this will come from Google Sheets
  const progressStats = [
    {
      label: "TOTAL WEIGHT LOSS",
      value: "12.4 lbs",
      description: "8 weeks progress",
      intent: "positive" as const,
      icon: GearIcon,
      direction: "up" as const
    },
    {
      label: "WEEKLY AVERAGE",
      value: "1.55 lbs",
      description: "per week",
      intent: "positive" as const,
      icon: ProcessorIcon,
      direction: "up" as const
    },
    {
      label: "CONSISTENCY",
      value: "95%",
      description: "Compliance rate",
      intent: "positive" as const,
      icon: BoomIcon,
      tag: "EXCELLENT 🔥"
    }
  ];

  return (
    <DashboardPageLayout
      header={{
        title: "Monitor Progress",
        description: "Track Your Journey",
        icon: EmailIcon,
      }}
    >
      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {progressStats.map((stat, index) => (
          <DashboardStat
            key={index}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            tag={stat.tag}
            intent={stat.intent}
            direction={stat.direction}
          />
        ))}
      </div>

      {/* Progress Chart */}
      <div className="mb-6">
        <DashboardChart />
      </div>

      {/* Progress Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Progress */}
        <DashboardCard
          title="WEIGHT PROGRESS"
          intent="success"
          addon={<Badge variant="outline-warning">TRENDING DOWN</Badge>}
        >
          <div className="space-y-4">
            {[
              { week: "Week 8", weight: "172.6 lbs", change: "-1.8 lbs", trend: "down" },
              { week: "Week 7", weight: "174.4 lbs", change: "-2.1 lbs", trend: "down" },
              { week: "Week 6", weight: "176.5 lbs", change: "-1.4 lbs", trend: "down" },
              { week: "Week 5", weight: "177.9 lbs", change: "-1.9 lbs", trend: "down" },
              { week: "Week 4", weight: "179.8 lbs", change: "-1.2 lbs", trend: "down" }
            ].map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-accent rounded">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded bg-primary text-primary-foreground size-8 font-display text-sm">
                    {8 - index}
                  </div>
                  <div>
                    <span className="font-medium">{entry.week}</span>
                    <span className="text-muted-foreground text-sm ml-2">{entry.weight}</span>
                  </div>
                </div>
                <Badge variant="default" className="text-success">
                  {entry.change}
                </Badge>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Goals & Milestones */}
        <DashboardCard
          title="GOALS & MILESTONES"
          intent="default"
        >
          <div className="space-y-4">
            {[
              { goal: "Lose 15 lbs", progress: 83, status: "In Progress", color: "bg-primary" },
              { goal: "Improve Energy", progress: 90, status: "Achieved", color: "bg-success" },
              { goal: "Reduce Waist 2 inches", progress: 65, status: "In Progress", color: "bg-warning" },
              { goal: "Complete 12 weeks", progress: 67, status: "In Progress", color: "bg-primary" }
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.goal}</span>
                  <Badge variant={item.status === "Achieved" ? "default" : "secondary"}>
                    {item.progress}%
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Photo Progress */}
      <DashboardCard
        title="PHOTO PROGRESS"
        intent="default"
        addon={<Badge variant="secondary">VISUAL TRACKING</Badge>}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { week: "Week 1", label: "Baseline" },
            { week: "Week 4", label: "Month 1" },
            { week: "Week 8", label: "Current" },
            { week: "Week 12", label: "Goal" }
          ].map((photo, index) => (
            <div key={index} className="space-y-2">
              <div className="aspect-[3/4] bg-accent rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm text-muted-foreground">{photo.week}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-center">{photo.label}</p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
