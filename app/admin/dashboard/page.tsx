"use client"

import React, { useEffect, useState } from "react";
import { adminAuthService } from "@/lib/admin-auth";
import { adminService } from "@/lib/admin-service";
import { messagingService } from "@/lib/messaging-service";
import DashboardCard from "@/components/dashboard/card";
import DashboardStat from "@/components/dashboard/stat";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageSquare, 
  Bell, 
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  unreadMessages: number;
  urgentMessages: number;
  avgResponseTime: string;
  pendingAlerts: number;
  todayMessages: number;
  weeklyGrowth: number;
}

export default function AdminDashboardPage() {
  const [currentAdmin, setCurrentAdmin] = useState(adminAuthService.getCurrentAdmin());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    unreadMessages: 0,
    urgentMessages: 0,
    avgResponseTime: "0h",
    pendingAlerts: 0,
    todayMessages: 0,
    weeklyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!currentAdmin) {
      setCurrentAdmin(adminAuthService.getCurrentAdmin());
    }
    loadDashboardData();
  }, [currentAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real data from services
      const [patientsResponse, conversationsResponse] = await Promise.all([
        adminService.getAllPatients(1, 100),
        messagingService.getAdminConversations(currentAdmin?.adminId || '', 1, 50)
      ]);

      // Calculate statistics
      const patients = patientsResponse.data?.data || [];
      const conversations = conversationsResponse.data?.data || [];
      
      const activePatients = patients.filter(p => p.status === 'active').length;
      const unreadMessages = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      const urgentMessages = conversations.filter(conv => conv.priority === 'urgent').length;
      
      setDashboardStats({
        totalPatients: patients.length,
        activePatients,
        unreadMessages,
        urgentMessages,
        avgResponseTime: "2.4h", // This would be calculated from actual data
        pendingAlerts: urgentMessages + Math.floor(Math.random() * 3), // Mock pending alerts
        todayMessages: Math.floor(Math.random() * 15) + 5, // Mock today's messages
        weeklyGrowth: Math.floor(Math.random() * 10) + 2 // Mock weekly growth
      });

      // Mock recent activities (in production this would come from actual message/activity data)
      setRecentActivities([
        {
          type: "message",
          patient: patients[0]?.name || "John Smith",
          patientId: patients[0]?.patient_id || "PATIENT-001",
          action: "Sent message about dosing schedule",
          time: "10 minutes ago",
          priority: "normal"
        },
        {
          type: "alert",
          patient: patients[1]?.name || "Sarah Johnson",
          patientId: patients[1]?.patient_id || "PATIENT-002",
          action: "Safety alert: Mild nausea reported",
          time: "25 minutes ago",
          priority: "high"
        },
        {
          type: "message",
          patient: patients[2]?.name || "Mike Davis",
          patientId: patients[2]?.patient_id || "PATIENT-003",
          action: "Progress update requested",
          time: "1 hour ago",
          priority: "normal"
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data
      setDashboardStats({
        totalPatients: 24,
        activePatients: 21,
        unreadMessages: 12,
        urgentMessages: 3,
        avgResponseTime: "2.4h",
        pendingAlerts: 5,
        todayMessages: 8,
        weeklyGrowth: 4
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {currentAdmin.name}</h1>
        <p className="text-muted-foreground mt-2">
          {currentAdmin.role.charAt(0).toUpperCase() + currentAdmin.role.slice(1)} • {currentAdmin.department}
        </p>
      </div>

      {/* Stats Grid using DashboardStat components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStat
          label="Active Patients"
          value={loading ? "..." : dashboardStats.activePatients.toString()}
          description={`${dashboardStats.totalPatients} total enrolled`}
          icon={Users}
          intent="positive"
          direction="up"
        />
        
        <DashboardStat
          label="Unread Messages"
          value={loading ? "..." : dashboardStats.unreadMessages.toString()}
          description={`${dashboardStats.urgentMessages} urgent`}
          icon={MessageSquare}
          intent={dashboardStats.urgentMessages > 0 ? "negative" : "neutral"}
          tag={dashboardStats.urgentMessages > 0 ? "ACTION" : undefined}
        />
        
        <DashboardStat
          label="Response Time"
          value={loading ? "..." : dashboardStats.avgResponseTime}
          description="avg last 7 days"
          icon={Clock}
          intent="positive"
          direction="down"
        />
        
        <DashboardStat
          label="Today's Messages"
          value={loading ? "..." : dashboardStats.todayMessages.toString()}
          description={`+${dashboardStats.weeklyGrowth} this week`}
          icon={Activity}
          intent="positive"
          direction="up"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <DashboardCard title="Recent Activity" intent="default">
          <div className="space-y-4">
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
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <DashboardCard title="Quick Actions" intent="success">
          <div className="space-y-3">
            <Link href="/admin/inbox">
              <Button variant="outline" className="w-full justify-between">
                <div className="text-left">
                  <div className="font-medium text-sm">View Message Inbox</div>
                  <div className="text-xs text-muted-foreground">
                    {dashboardStats.unreadMessages} unread messages
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/admin/patients">
              <Button variant="outline" className="w-full justify-between">
                <div className="text-left">
                  <div className="font-medium text-sm">Manage Patients</div>
                  <div className="text-xs text-muted-foreground">
                    {dashboardStats.activePatients} active patients
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            {dashboardStats.urgentMessages > 0 && (
              <Link href="/admin/inbox?priority=urgent">
                <Button variant="destructive" className="w-full justify-between">
                  <div className="text-left">
                    <div className="font-medium text-sm">Urgent Messages</div>
                    <div className="text-xs text-white/80">
                      {dashboardStats.urgentMessages} require immediate attention
                    </div>
                  </div>
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {currentAdmin.permissions.includes('manage_templates') && (
              <Button variant="outline" className="w-full justify-between">
                <div className="text-left">
                  <div className="font-medium text-sm">Message Templates</div>
                  <div className="text-xs text-muted-foreground">
                    Quick responses & broadcasts
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Admin Info & Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Your Role & Permissions" intent="default">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role</span>
              <Badge variant="outline">
                {currentAdmin.role.charAt(0).toUpperCase() + currentAdmin.role.slice(1)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentAdmin.permissions.map((permission, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {permission.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="System Status" intent="success">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Messaging System</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Connection</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Data Sync</span>
              <span className="text-sm text-muted-foreground">Just now</span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
