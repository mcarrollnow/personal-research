"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { adminAuthService } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Home,
  Inbox,
  FileText,
  Bell
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  permission?: string;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const currentAdmin = adminAuthService.getCurrentAdmin();

  const handleLogout = () => {
    adminAuthService.logout();
    router.push("/admin/login");
  };

  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
      permission: "view_patients"
    },
    {
      name: "Patients",
      href: "/admin/patients",
      icon: Users,
      permission: "view_patients"
    },
    {
      name: "Inbox",
      href: "/admin/inbox",
      icon: Inbox,
      badge: "12", // This would be dynamic in real implementation
      permission: "send_messages"
    },
    {
      name: "Messages",
      href: "/admin/messages",
      icon: MessageSquare,
      permission: "send_messages"
    },
    {
      name: "Templates",
      href: "/admin/templates",
      icon: FileText,
      permission: "manage_templates"
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      permission: "view_analytics"
    },
    {
      name: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      permission: "view_patients"
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      permission: "manage_admins"
    }
  ];

  // Filter nav items based on permissions
  const allowedNavItems = navigationItems.filter(item => 
    !item.permission || adminAuthService.hasPermission(item.permission)
  );

  if (!currentAdmin) {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Admin Portal</h1>
            {title && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{title}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{currentAdmin.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentAdmin.role} • {currentAdmin.department}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {currentAdmin.role}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r bg-card">
          <nav className="p-4 space-y-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Admin Info Card */}
          <div className="p-4 mt-8">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Current Session</h4>
                  <p className="text-xs text-muted-foreground">
                    ID: {currentAdmin.adminId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permissions: {currentAdmin.permissions.length} active
                  </p>
                  {currentAdmin.lastLogin && (
                    <p className="text-xs text-muted-foreground">
                      Last login: {new Date(currentAdmin.lastLogin).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{title}</h2>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
