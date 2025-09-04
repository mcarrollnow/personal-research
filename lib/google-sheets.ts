// Google Sheets Integration for Peptide Tracking
// This utility handles data submission to Google Sheets for clinical trial data collection

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  sheetNames: {
    patientProfiles: string;
    dailyLogs: string;
    weeklyAssessments: string;
    dosingProtocols: string;
    sideEffectReports: string;
    progressGoals: string;
  };
}

// Column mapping for Google Sheets
export const SHEET_COLUMNS = {
  patientProfiles: [
    'Patient ID',
    'Name', 
    'Email',
    'Age',
    'Gender',
    'Start Date',
    'Peptide Type',
    'Starting Weight (lbs)',
    'Goal Weight (lbs)',
    'Height (ft)',
    'Height (in)',
    'Medical Conditions',
    'Current Medications',
    'Enrollment Date',
    'Timestamp'
  ],
  
  dailyLogs: [
    'Log ID',
    'Patient ID',
    'Date',
    'Weight (lbs)',
    'Waist Circumference (in)',
    'Hip Circumference (in)', 
    'Neck Circumference (in)',
    'Energy Level (1-5)',
    'Appetite Level (1-5)',
    'Sleep Quality (1-5)',
    'Mood (1-5)',
    'Dose Taken',
    'Dose Time',
    'Injection Site',
    'Side Effects',
    'Side Effect Severity',
    'Notes',
    'Progress Photo URL',
    'Timestamp'
  ],

  weeklyAssessments: [
    'Assessment ID',
    'Patient ID', 
    'Week Number',
    'Assessment Date',
    'Average Weight (lbs)',
    'Total Weight Loss (lbs)',
    'Average Energy Level',
    'Compliance Rate (%)',
    'Side Effect Frequency',
    'Overall Wellbeing (1-5)',
    'Progress Notes',
    'Next Week Goals',
    'Timestamp'
  ],

  dosingProtocols: [
    'Protocol ID',
    'Patient ID',
    'Peptide Type',
    'Current Dose',
    'Dose Unit',
    'Frequency',
    'Injection Day',
    'Protocol Start Date',
    'Protocol End Date',
    'Is Active',
    'Escalation Notes',
    'Timestamp'
  ],

  sideEffectReports: [
    'Report ID',
    'Patient ID',
    'Report Date',
    'Side Effect',
    'Severity',
    'Duration',
    'Action Taken',
    'Resolved',
    'Timestamp'
  ],

  progressGoals: [
    'Goal ID',
    'Patient ID',
    'Goal Type',
    'Description',
    'Target Value',
    'Current Value',
    'Target Date',
    'Is Achieved',
    'Created Date',
    'Timestamp'
  ]
};

class GoogleSheetsService {
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  // Generate unique ID for entries
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format data for Google Sheets submission
  private formatRowData(data: any, sheetType: keyof typeof SHEET_COLUMNS): any[] {
    const columns = SHEET_COLUMNS[sheetType];
    const row = new Array(columns.length).fill('');
    
    // Add timestamp
    data.timestamp = new Date().toISOString();
    
    // Map data to columns based on sheet type
    switch (sheetType) {
      case 'dailyLogs':
        return [
          data.id || this.generateId(),
          data.patientId,
          data.date,
          data.weight,
          data.waistCircumference,
          data.hipCircumference,
          data.neckCircumference,
          data.energyLevel,
          data.appetiteLevel,
          data.sleepQuality,
          data.mood,
          data.doseTaken,
          data.doseTime,
          data.injectionSite,
          data.sideEffects,
          data.sideEffectSeverity,
          data.notes,
          data.progressPhotoUrl,
          data.timestamp
        ];
      
      case 'patientProfiles':
        return [
          data.id || this.generateId(),
          data.name,
          data.email,
          data.age,
          data.gender,
          data.startDate,
          data.peptideType,
          data.startingWeight,
          data.goalWeight,
          data.heightFeet,
          data.heightInches,
          Array.isArray(data.medicalConditions) ? data.medicalConditions.join(', ') : data.medicalConditions,
          Array.isArray(data.medications) ? data.medications.join(', ') : data.medications,
          data.enrollmentDate,
          data.timestamp
        ];
      
      // Add other sheet types as needed
      default:
        return [];
    }
  }

  // Submit data to Google Sheets
  async submitData(data: any, sheetType: keyof typeof SHEET_COLUMNS): Promise<boolean> {
    try {
      const rowData = this.formatRowData(data, sheetType);
      const sheetName = this.config.sheetNames[sheetType];
      
      // This would integrate with Google Sheets API
      // For now, we'll log the data structure
      console.log(`Submitting to ${sheetName}:`, rowData);
      
      // TODO: Implement actual Google Sheets API call
      // const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}:append`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.config.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     values: [rowData],
      //     valueInputOption: 'RAW'
      //   })
      // });
      
      return true;
    } catch (error) {
      console.error('Error submitting to Google Sheets:', error);
      return false;
    }
  }

  // Get data from Google Sheets
  async getData(sheetType: keyof typeof SHEET_COLUMNS, patientId?: string): Promise<any[]> {
    try {
      // TODO: Implement actual Google Sheets API call to fetch data
      // This would filter by patientId if provided
      console.log(`Fetching data from ${sheetType} for patient ${patientId}`);
      return [];
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      return [];
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService({
  spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
  apiKey: process.env.GOOGLE_SHEETS_API_KEY || '',
  sheetNames: {
    patientProfiles: 'Patient_Profiles',
    dailyLogs: 'Daily_Logs',
    weeklyAssessments: 'Weekly_Assessments', 
    dosingProtocols: 'Dosing_Protocols',
    sideEffectReports: 'Side_Effect_Reports',
    progressGoals: 'Progress_Goals'
  }
});

export default GoogleSheetsService;
