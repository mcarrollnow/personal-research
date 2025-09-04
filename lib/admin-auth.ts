// Admin Authentication Service
// Handles admin login and role-based access control

import { adminService } from './admin-service';

export interface AdminSession {
  adminId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  permissions: string[];
  lastLogin?: string;
}

class AdminAuthService {
  private currentSession: AdminSession | null = null;

  // Admin authentication with role verification
  async authenticateAdmin(email: string, adminId: string): Promise<boolean> {
    try {
      // First check mock/demo admins for development
      const mockAdmins = [
        {
          adminId: "ADMIN-001",
          email: "admin@clinic.com",
          name: "Dr. Sarah Johnson",
          role: "coordinator",
          department: "Clinical Research",
          permissions: ["view_patients", "send_messages", "manage_templates", "view_analytics"]
        },
        {
          adminId: "ADMIN-002",
          email: "supervisor@clinic.com", 
          name: "Dr. Michael Chen",
          role: "supervisor",
          department: "Medical Oversight",
          permissions: ["view_patients", "send_messages", "manage_templates", "view_analytics", "manage_admins", "escalate_cases"]
        },
        {
          adminId: "ADMIN-003",
          email: "support@clinic.com",
          name: "Lisa Rodriguez",
          role: "support",
          department: "Patient Support",
          permissions: ["view_patients", "send_messages"]
        }
      ];

      // Check mock admins first
      const mockAdmin = mockAdmins.find(a => a.email === email && a.adminId === adminId);
      
      if (mockAdmin) {
        this.currentSession = {
          ...mockAdmin,
          lastLogin: new Date().toISOString()
        };
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminSession', JSON.stringify(this.currentSession));
        }
        
        // Update last login in Supabase if admin exists
        try {
          await adminService.updateLastLogin(adminId);
        } catch (error) {
          console.log('Could not update last login in Supabase:', error);
        }
        
        return true;
      }

      // If not a mock admin, try Supabase authentication
      const adminResponse = await adminService.getAdminUser(adminId);
      
      if (adminResponse.success && adminResponse.data) {
        const admin = adminResponse.data;
        
        // In production, you'd verify password here
        // For now, just check email matches
        if (admin.email === email && admin.active_status) {
          this.currentSession = {
            adminId: admin.admin_id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            department: admin.department,
            permissions: admin.permissions || [],
            lastLogin: new Date().toISOString()
          };
          
          // Store in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('adminSession', JSON.stringify(this.currentSession));
          }
          
          // Update last login
          await adminService.updateLastLogin(adminId);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Admin authentication error:', error);
      return false;
    }
  }

  // Get current admin session
  getCurrentAdmin(): AdminSession | null {
    if (this.currentSession) {
      return this.currentSession;
    }

    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminSession');
      if (stored) {
        this.currentSession = JSON.parse(stored);
        return this.currentSession;
      }
    }

    return null;
  }

  // Get current admin ID
  getCurrentAdminId(): string | null {
    const session = this.getCurrentAdmin();
    return session?.adminId || null;
  }

  // Get current admin role
  getCurrentAdminRole(): string | null {
    const session = this.getCurrentAdmin();
    return session?.role || null;
  }

  // Check if admin has specific permission
  hasPermission(permission: string): boolean {
    const session = this.getCurrentAdmin();
    return session?.permissions.includes(permission) || false;
  }

  // Check if admin has role (or higher)
  hasRole(requiredRole: string): boolean {
    const session = this.getCurrentAdmin();
    if (!session) return false;

    const roleHierarchy = {
      'support': 1,
      'coordinator': 2,
      'supervisor': 3,
      'admin': 4
    };

    const currentRoleLevel = roleHierarchy[session.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return currentRoleLevel >= requiredRoleLevel;
  }

  // Logout admin
  logout(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminSession');
    }
  }

  // Check if admin is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentAdmin() !== null;
  }

  // Check if current user is admin (vs patient)
  isAdmin(): boolean {
    return this.isAuthenticated();
  }

  // Generate admin access link
  generateAdminAccessLink(adminId: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    return `${baseUrl}/admin/login?admin=${adminId}&token=${this.generateSecureToken(adminId)}`;
  }

  private generateSecureToken(adminId: string): string {
    // In production, use proper JWT or secure token generation
    return btoa(`admin-${adminId}-${Date.now()}`);
  }

  // Validate admin session
  async validateSession(): Promise<boolean> {
    const session = this.getCurrentAdmin();
    if (!session) return false;

    try {
      // Check if admin still exists and is active in Supabase
      const adminResponse = await adminService.getAdminUser(session.adminId);
      
      if (adminResponse.success && adminResponse.data?.active_status) {
        return true;
      }
      
      // Session invalid, logout
      this.logout();
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      return true; // Allow offline operation with cached session
    }
  }
}

export const adminAuthService = new AdminAuthService();
export default AdminAuthService;
