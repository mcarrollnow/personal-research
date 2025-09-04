// Peptide Tracking Data Types for Google Sheets Integration

export interface PatientProfile {
  id: string
  name: string
  email: string
  age: number
  gender: "male" | "female" | "other"
  startDate: string
  peptideType: string
  startingWeight: number
  goalWeight: number
  heightFeet: number
  heightInches: number
  medicalConditions: string[]
  medications: string[]
  createdAt: string
}

export interface DailyEntry {
  id: string
  patientId: string
  date: string
  weight: number
  waistCircumference?: number
  hipCircumference?: number
  neckCircumference?: number
  bodyFatPercentage?: number
  energyLevel: 1 | 2 | 3 | 4 | 5
  appetiteLevel: 1 | 2 | 3 | 4 | 5
  sleepQuality: 1 | 2 | 3 | 4 | 5
  mood: 1 | 2 | 3 | 4 | 5
  doseTaken: "yes" | "partial" | "no"
  doseTime?: string
  injectionSite?: "abdomen" | "thigh" | "upperArm"
  sideEffects: string[]
  sideEffectSeverity: "none" | "mild" | "moderate" | "severe"
  notes: string
  progressPhotoUrl?: string
  createdAt: string
}

export interface WeeklyAssessment {
  id: string
  patientId: string
  weekNumber: number
  date: string
  averageWeight: number
  weightLoss: number
  averageEnergyLevel: number
  complianceRate: number
  sideEffectFrequency: number
  overallWellbeing: 1 | 2 | 3 | 4 | 5
  progressNotes: string
  nextWeekGoals: string[]
  createdAt: string
}

export interface DosingProtocol {
  id: string
  patientId: string
  peptideType: string
  currentDose: number
  doseUnit: "mg" | "mcg" | "units"
  frequency: "daily" | "weekly" | "biweekly"
  injectionDay?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
  escalationSchedule: DosingPhase[]
  startDate: string
  endDate?: string
  isActive: boolean
}

export interface DosingPhase {
  weekStart: number
  weekEnd: number
  dose: number
  doseUnit: string
  notes?: string
}

export interface SideEffectReport {
  id: string
  patientId: string
  date: string
  sideEffect: string
  severity: "mild" | "moderate" | "severe"
  duration: string
  actionTaken: string
  resolved: boolean
  createdAt: string
}

export interface ProgressGoal {
  id: string
  patientId: string
  goalType: "weight" | "measurement" | "energy" | "custom"
  description: string
  targetValue: number
  currentValue: number
  targetDate: string
  isAchieved: boolean
  createdAt: string
}

// Google Sheets Column Structure
export interface GoogleSheetsStructure {
  // Patient Profiles Sheet
  patientProfiles: {
    patientId: string
    name: string
    email: string
    age: number
    gender: string
    startDate: string
    peptideType: string
    startingWeight: number
    goalWeight: number
    height: string
    medicalConditions: string
    currentMedications: string
    enrollmentDate: string
  }

  // Daily Logs Sheet  
  dailyLogs: {
    logId: string
    patientId: string
    date: string
    weight: number
    waistCircumference: number
    hipCircumference: number
    neckCircumference: number
    energyLevel: number
    appetiteLevel: number
    sleepQuality: number
    mood: number
    doseTaken: string
    doseTime: string
    injectionSite: string
    sideEffects: string
    sideEffectSeverity: string
    notes: string
    progressPhotoUrl: string
    timestamp: string
  }

  // Weekly Assessments Sheet
  weeklyAssessments: {
    assessmentId: string
    patientId: string
    weekNumber: number
    assessmentDate: string
    averageWeight: number
    totalWeightLoss: number
    averageEnergyLevel: number
    complianceRate: number
    sideEffectFrequency: number
    overallWellbeing: number
    progressNotes: string
    nextWeekGoals: string
    timestamp: string
  }

  // Dosing Protocols Sheet
  dosingProtocols: {
    protocolId: string
    patientId: string
    peptideType: string
    currentDose: number
    doseUnit: string
    frequency: string
    injectionDay: string
    protocolStartDate: string
    protocolEndDate: string
    isActive: boolean
    escalationNotes: string
  }

  // Side Effect Reports Sheet
  sideEffectReports: {
    reportId: string
    patientId: string
    reportDate: string
    sideEffect: string
    severity: string
    duration: string
    actionTaken: string
    resolved: boolean
    timestamp: string
  }

  // Progress Goals Sheet
  progressGoals: {
    goalId: string
    patientId: string
    goalType: string
    description: string
    targetValue: number
    currentValue: number
    targetDate: string
    isAchieved: boolean
    createdDate: string
  }
}
