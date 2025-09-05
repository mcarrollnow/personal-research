// Demo Data Service - Provides mock data for testing when Supabase tables don't exist
export interface DemoPatient {
  id: string
  name: string
  email: string
  phone: string
  starting_weight: number
  target_weight: number
  current_week: number
}

export interface DemoSafetyAlert {
  id: string
  patientId: string
  severity: 'mild' | 'moderate' | 'severe'
  sideEffects: string[]
  reportedAt: string
  escalated: boolean
  adminNotified: boolean
  status: 'active' | 'resolved' | 'monitoring'
}

export interface DemoMilestone {
  id: string
  patientId: string
  type: 'weight_loss' | 'goal_achievement' | 'week_completion' | 'compliance_streak'
  value: number
  target: number
  achievedAt: string
  celebrated: boolean
  message: string
}

export interface DemoComplianceAlert {
  id: string
  patientId: string
  type: 'missed_dose' | 'incomplete_log' | 'low_compliance'
  daysCount: number
  lastActivity: string
  followUpSent: boolean
  status: 'pending' | 'addressed' | 'resolved'
}

class DemoDataService {
  private demoPatients: DemoPatient[] = [
    {
      id: 'DEMO-PATIENT-001',
      name: 'Demo Patient',
      email: 'demo@example.com',
      phone: '(555) 123-4567',
      starting_weight: 190,
      target_weight: 160,
      current_week: 12
    }
  ]

  private demoSafetyAlerts: DemoSafetyAlert[] = []
  private demoMilestones: DemoMilestone[] = []
  private demoComplianceAlerts: DemoComplianceAlert[] = []

  // Get demo patient
  getDemoPatient(patientId: string): DemoPatient | null {
    return this.demoPatients.find(p => p.id === patientId) || null
  }

  // Create demo safety alert
  createDemoSafetyAlert(
    patientId: string, 
    sideEffects: string[], 
    severity: 'mild' | 'moderate' | 'severe'
  ): DemoSafetyAlert {
    const alert: DemoSafetyAlert = {
      id: `demo_safety_${Date.now()}_${patientId}`,
      patientId,
      severity,
      sideEffects,
      reportedAt: new Date().toISOString(),
      escalated: severity === 'severe',
      adminNotified: severity !== 'mild',
      status: severity === 'severe' ? 'active' : 'monitoring'
    }

    this.demoSafetyAlerts.push(alert)
    return alert
  }

  // Create demo milestone
  createDemoMilestone(
    patientId: string,
    type: DemoMilestone['type'],
    value: number,
    target: number,
    message: string
  ): DemoMilestone {
    const milestone: DemoMilestone = {
      id: `demo_milestone_${Date.now()}_${patientId}`,
      patientId,
      type,
      value,
      target,
      achievedAt: new Date().toISOString(),
      celebrated: false,
      message
    }

    this.demoMilestones.push(milestone)
    return milestone
  }

  // Check for demo milestones
  checkDemoMilestones(patientId: string, currentWeight: number, weekNumber: number): DemoMilestone[] {
    const patient = this.getDemoPatient(patientId)
    if (!patient) return []

    const milestones: DemoMilestone[] = []
    const weightLoss = patient.starting_weight - currentWeight
    const progressPercent = (weightLoss / (patient.starting_weight - patient.target_weight)) * 100

    // Check weight loss milestones
    const weightMilestones = [5, 10, 15, 20, 25, 30]
    for (const milestone of weightMilestones) {
      if (weightLoss >= milestone) {
        const existing = this.demoMilestones.find(m => 
          m.patientId === patientId && m.type === 'weight_loss' && m.value === milestone
        )
        if (!existing) {
          const newMilestone = this.createDemoMilestone(
            patientId,
            'weight_loss',
            milestone,
            milestone,
            `🎉 Congratulations! You've lost ${milestone} pounds! That's incredible progress on your health journey. Keep up the amazing work!`
          )
          milestones.push(newMilestone)
        }
      }
    }

    // Check week completion milestones
    const weekMilestones = [4, 8, 12, 16, 20, 24]
    for (const milestone of weekMilestones) {
      if (weekNumber >= milestone) {
        const existing = this.demoMilestones.find(m => 
          m.patientId === patientId && m.type === 'week_completion' && m.value === milestone
        )
        if (!existing) {
          const newMilestone = this.createDemoMilestone(
            patientId,
            'week_completion',
            milestone,
            milestone,
            `🏆 Amazing! You've completed ${milestone} weeks of your program! Your dedication and consistency are truly inspiring. You're ${Math.round(progressPercent)}% of the way to your goal!`
          )
          milestones.push(newMilestone)
        }
      }
    }

    // Check goal achievement milestones
    const goalMilestones = [25, 50, 75, 100]
    for (const milestone of goalMilestones) {
      if (progressPercent >= milestone) {
        const existing = this.demoMilestones.find(m => 
          m.patientId === patientId && m.type === 'goal_achievement' && m.value === milestone
        )
        if (!existing) {
          let message = `🎯 You've reached ${milestone}% of your weight loss goal! `
          if (milestone === 100) {
            message = `🎊 GOAL ACHIEVED! You've reached 100% of your weight loss target! This is a monumental achievement that shows your incredible dedication and perseverance!`
          } else if (milestone === 75) {
            message += `You're in the final stretch - amazing work!`
          } else if (milestone === 50) {
            message += `You're halfway there - fantastic progress!`
          } else {
            message += `You're off to a great start!`
          }
          
          const newMilestone = this.createDemoMilestone(
            patientId,
            'goal_achievement',
            milestone,
            100,
            message
          )
          milestones.push(newMilestone)
        }
      }
    }

    return milestones
  }

  // Create demo compliance alerts
  createDemoComplianceAlerts(patientId: string): DemoComplianceAlert[] {
    const alerts: DemoComplianceAlert[] = []

    // Simulate some compliance issues for demo
    const missedDoseAlert: DemoComplianceAlert = {
      id: `demo_compliance_${Date.now()}_missed_dose`,
      patientId,
      type: 'missed_dose',
      daysCount: 2,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      followUpSent: false,
      status: 'pending'
    }

    const incompleteLogAlert: DemoComplianceAlert = {
      id: `demo_compliance_${Date.now()}_incomplete_log`,
      patientId,
      type: 'incomplete_log',
      daysCount: 3,
      lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      followUpSent: false,
      status: 'pending'
    }

    // Randomly include some alerts for demo purposes
    if (Math.random() > 0.5) {
      alerts.push(missedDoseAlert)
      this.demoComplianceAlerts.push(missedDoseAlert)
    }

    if (Math.random() > 0.7) {
      alerts.push(incompleteLogAlert)
      this.demoComplianceAlerts.push(incompleteLogAlert)
    }

    return alerts
  }

  // Get demo compliance rate
  getDemoComplianceRate(patientId: string): number {
    // Simulate a realistic compliance rate
    return Math.floor(Math.random() * 30) + 70 // 70-100%
  }

  // Clear demo data (for testing)
  clearDemoData(): void {
    this.demoSafetyAlerts = []
    this.demoMilestones = []
    this.demoComplianceAlerts = []
  }

  // Get all demo data for debugging
  getAllDemoData() {
    return {
      patients: this.demoPatients,
      safetyAlerts: this.demoSafetyAlerts,
      milestones: this.demoMilestones,
      complianceAlerts: this.demoComplianceAlerts
    }
  }
}

export const demoDataService = new DemoDataService()
