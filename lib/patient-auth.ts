// Patient Authentication Service
// Handles patient login and ensures users only see their own data

export interface PatientSession {
  patientId: string;
  name: string;
  email: string;
  peptideType: string;
  startDate: string;
}

class PatientAuthService {
  private currentSession: PatientSession | null = null;

  // Simple authentication - in production, use proper auth (Auth0, NextAuth, etc.)
  async authenticatePatient(email: string, patientId: string): Promise<boolean> {
    try {
      // In production, this would verify credentials against your user database
      // For now, we'll simulate authentication
      
      // You could store patient credentials in a separate Google Sheet
      // or use a proper authentication provider
      
      const mockPatients = [
        {
          patientId: "PATIENT-001",
          email: "john.smith@email.com",
          name: "John Smith",
          peptideType: "semaglutide",
          startDate: "2024-01-15"
        },
        {
          patientId: "PATIENT-002", 
          email: "sarah.j@email.com",
          name: "Sarah Johnson",
          peptideType: "tirzepatide",
          startDate: "2024-01-20"
        }
      ];

      const patient = mockPatients.find(p => p.email === email && p.patientId === patientId);
      
      if (patient) {
        this.currentSession = patient;
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('patientSession', JSON.stringify(patient));
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Get current patient session
  getCurrentPatient(): PatientSession | null {
    if (this.currentSession) {
      return this.currentSession;
    }

    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('patientSession');
      if (stored) {
        this.currentSession = JSON.parse(stored);
        return this.currentSession;
      }
    }

    return null;
  }

  // Get current patient ID for data filtering
  getCurrentPatientId(): string | null {
    const session = this.getCurrentPatient();
    return session?.patientId || null;
  }

  // Logout patient
  logout(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('patientSession');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentPatient() !== null;
  }

  // Generate unique access link for a patient
  generatePatientAccessLink(patientId: string): string {
    // In production, this would generate a secure token
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    return `${baseUrl}/login?patient=${patientId}&token=${this.generateSecureToken(patientId)}`;
  }

  private generateSecureToken(patientId: string): string {
    // In production, use proper JWT or secure token generation
    return btoa(`${patientId}-${Date.now()}`);
  }
}

export const patientAuthService = new PatientAuthService();
export default PatientAuthService;
