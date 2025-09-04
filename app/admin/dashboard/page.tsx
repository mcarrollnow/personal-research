"use client"

import React from "react";
import { adminAuthService } from "@/lib/admin-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { 
  Users, 
  MessageSquare, 
  Bell, 
  TrendingUp,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function AdminDashboardPage() {
  const currentAdmin = adminAuthService.getCurrentAdmin();

  if (!currentAdmin) {
    return <div>Loading...</div>;
  }

  // Mock data for dashboard
  const dashboardStats = [
    {
      title: "Active Patients",
      value: "24",
      change: "+3 this week",
      icon: Users,
      variant: "success" as const
    },
    {
      title: "Unread Messages",
      value: "12",
      change: "3 urgent",
      icon: MessageSquare,
      variant: "warning" as const
    },
    {
      title: "Pending Alerts",
      value: "5",
      change: "2 safety concerns",
      icon: AlertTriangle,
      variant: "destructive" as const
    },
    {
      title: "Response Time",
      value: "2.4h",
      change: "avg last 7 days",
      icon: Clock,
      variant: "default" as const
    }
  ];

  const recentActivities = [
    {
      type: "message",
      patient: "John Smith (PATIENT-001)",
      action: "Sent message about dosing schedule",
      time: "10 minutes ago",
      priority: "normal"
    },
    {
      type: "alert",
      patient: "Sarah Johnson (PATIENT-002)",
      action: "Safety alert: Mild nausea reported",
      time: "25 minutes ago",
      priority: "high"
    },
    {
      type: "message",
      patient: "Mike Davis (PATIENT-003)",
      action: "Progress update requested",
      time: "1 hour ago",
      priority: "normal"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {currentAdmin.name}</h1>
        <p className="text-muted-foreground mt-2">
          {currentAdmin.role.charAt(0).toUpperCase() + currentAdmin.role.slice(1)} • {currentAdmin.department}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Bullet 
                  variant={activity.priority === 'high' ? 'destructive' : 'default'} 
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.patient}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                {activity.priority === 'high' && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <button className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium text-sm">View Urgent Messages</div>
                <div className="text-xs text-muted-foreground">3 patients need immediate attention</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium text-sm">Send Broadcast Message</div>
                <div className="text-xs text-muted-foreground">Weekly check-in reminder</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium text-sm">Review Safety Alerts</div>
                <div className="text-xs text-muted-foreground">2 pending safety reviews</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium text-sm">Patient Progress Reports</div>
                <div className="text-xs text-muted-foreground">Generate weekly summaries</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {currentAdmin.permissions.map((permission, index) => (
              <Badge key={index} variant="outline">
                {permission.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
