"use client"

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardStat from "@/components/dashboard/stat";
import DashboardChart from "@/components/dashboard/chart";
import RebelsRanking from "@/components/dashboard/rebels-ranking";
import SecurityStatus from "@/components/dashboard/security-status";
import BracketsIcon from "@/components/icons/brackets";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import BoomIcon from "@/components/icons/boom";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";
import { dashboardDataService } from "@/lib/dashboard-data";
import type { DashboardData } from "@/lib/dashboard-data";

const mockData = mockDataJson as MockData;

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
};

export default function DashboardOverview() {
  const [realData, setRealData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardDataService.getDashboardData();
        setRealData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create dynamic stats from real data or fall back to mock data
  const dynamicStats = realData ? [
    {
      label: "TOTAL WEIGHT LOSS",
      value: `${realData.stats.totalWeightLoss} lbs`,
      description: `${realData.stats.weeksActive} weeks`,
      intent: realData.stats.totalWeightLoss > 0 ? "positive" as const : "neutral" as const,
      icon: "gear",
      direction: realData.stats.totalWeightLoss > 0 ? "down" as const : "up" as const // Down arrow for weight loss
    },
    {
      label: "WEEKLY AVERAGE",
      value: `${realData.stats.weeklyAverage} lbs`,
      description: "per week",
      intent: realData.stats.weeklyAverage > 0 ? "positive" as const : "neutral" as const,
      icon: "proccesor", 
      direction: realData.stats.weeklyAverage > 0 ? "down" as const : "up" as const // Down arrow for weight loss
    },
    {
      label: "RECENT TREND",
      value: `${Math.abs(realData.stats.recentTrend)} lbs`,
      description: realData.stats.recentTrend > 0 ? "lost this week" : realData.stats.recentTrend < 0 ? "gained this week" : "no change",
      intent: realData.stats.recentTrend > 0 ? "positive" as const : realData.stats.recentTrend < 0 ? "negative" as const : "neutral" as const,
      icon: "boom",
      direction: realData.stats.recentTrend > 0 ? "down" as const : realData.stats.recentTrend < 0 ? "up" as const : undefined,
      tag: realData.stats.recentTrend > 2 ? "EXCELLENT 🔥" : realData.stats.recentTrend < -1 ? "WATCH 📈" : undefined
    }
  ] : mockData.dashboardStats;

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: loading ? "Loading..." : `Last updated ${new Date().toLocaleTimeString()}`,
        icon: BracketsIcon,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {dynamicStats.map((stat, index) => (
          <DashboardStat
            key={index}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={iconMap[stat.icon as keyof typeof iconMap]}
            tag={stat.tag}
            intent={stat.intent}
            direction={stat.direction}
          />
        ))}
      </div>

      <div className="mb-6">
        <DashboardChart />
      </div>

      {/* Main 2-column grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RebelsRanking rebels={mockData.rebelsRanking} />
        <SecurityStatus statuses={mockData.securityStatus} />
      </div>
    </DashboardPageLayout>
  );
}
