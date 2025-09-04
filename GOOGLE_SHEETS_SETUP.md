# Google Sheets Setup for Peptide Tracking Dashboard

## Overview
This document outlines the Google Sheets structure needed for the peptide tracking dashboard. Each sheet will collect different types of clinical trial data from patients.

## Sheet Structure

### 1. Patient_Profiles Sheet
**Purpose**: Store basic patient information and enrollment details

| Column | Data Type | Description |
|--------|-----------|-------------|
| Patient ID | Text | Unique identifier for each patient |
| Name | Text | Patient's full name |
| Email | Text | Patient's email address |
| Age | Number | Patient's age at enrollment |
| Gender | Text | Male/Female/Other |
| Start Date | Date | When patient started the program |
| Peptide Type | Text | Type of peptide being used (e.g., Semaglutide) |
| Starting Weight (lbs) | Number | Baseline weight |
| Goal Weight (lbs) | Number | Target weight |
| Height (ft) | Number | Height in feet |
| Height (in) | Number | Additional inches |
| Medical Conditions | Text | Comma-separated list of conditions |
| Current Medications | Text | Comma-separated list of medications |
| Enrollment Date | Date | Date enrolled in study |
| Timestamp | DateTime | When record was created |

### 2. Daily_Logs Sheet  
**Purpose**: Daily tracking data from patients

| Column | Data Type | Description |
|--------|-----------|-------------|
| Log ID | Text | Unique identifier for each daily entry |
| Patient ID | Text | Links to Patient_Profiles sheet |
| Date | Date | Date of the log entry |
| Weight (lbs) | Number | Daily weight measurement |
| Waist Circumference (in) | Number | Waist measurement |
| Hip Circumference (in) | Number | Hip measurement |
| Neck Circumference (in) | Number | Neck measurement |
| Energy Level (1-5) | Number | Self-reported energy level |
| Appetite Level (1-5) | Number | Self-reported appetite level |
| Sleep Quality (1-5) | Number | Self-reported sleep quality |
| Mood (1-5) | Number | Self-reported mood |
| Dose Taken | Text | Yes/Partial/No |
| Dose Time | Time | Time dose was administered |
| Injection Site | Text | Abdomen/Thigh/Upper Arm |
| Side Effects | Text | Description of any side effects |
| Side Effect Severity | Text | None/Mild/Moderate/Severe |
| Notes | Text | Additional patient notes |
| Progress Photo URL | Text | Link to progress photo if uploaded |
| Timestamp | DateTime | When record was submitted |

### 3. Weekly_Assessments Sheet
**Purpose**: Weekly summary and analysis data

| Column | Data Type | Description |
|--------|-----------|-------------|
| Assessment ID | Text | Unique identifier |
| Patient ID | Text | Links to Patient_Profiles sheet |
| Week Number | Number | Week number in the program |
| Assessment Date | Date | Date of assessment |
| Average Weight (lbs) | Number | Average weight for the week |
| Total Weight Loss (lbs) | Number | Cumulative weight loss |
| Average Energy Level | Number | Average energy level for week |
| Compliance Rate (%) | Number | Percentage of doses taken |
| Side Effect Frequency | Number | Number of days with side effects |
| Overall Wellbeing (1-5) | Number | Overall wellbeing rating |
| Progress Notes | Text | Weekly progress summary |
| Next Week Goals | Text | Goals for upcoming week |
| Timestamp | DateTime | When assessment was completed |

### 4. Dosing_Protocols Sheet
**Purpose**: Track dosing schedules and escalations

| Column | Data Type | Description |
|--------|-----------|-------------|
| Protocol ID | Text | Unique identifier |
| Patient ID | Text | Links to Patient_Profiles sheet |
| Peptide Type | Text | Type of peptide |
| Current Dose | Number | Current dose amount |
| Dose Unit | Text | mg/mcg/units |
| Frequency | Text | Daily/Weekly/Biweekly |
| Injection Day | Text | Day of week for weekly injections |
| Protocol Start Date | Date | When protocol started |
| Protocol End Date | Date | When protocol ends (if applicable) |
| Is Active | Boolean | Whether protocol is currently active |
| Escalation Notes | Text | Notes about dose escalations |
| Timestamp | DateTime | When record was created/updated |

### 5. Side_Effect_Reports Sheet
**Purpose**: Detailed side effect tracking

| Column | Data Type | Description |
|--------|-----------|-------------|
| Report ID | Text | Unique identifier |
| Patient ID | Text | Links to Patient_Profiles sheet |
| Report Date | Date | Date side effect occurred |
| Side Effect | Text | Name/description of side effect |
| Severity | Text | Mild/Moderate/Severe |
| Duration | Text | How long side effect lasted |
| Action Taken | Text | What action was taken |
| Resolved | Boolean | Whether side effect resolved |
| Timestamp | DateTime | When report was submitted |

### 6. Progress_Goals Sheet
**Purpose**: Track patient goals and achievements

| Column | Data Type | Description |
|--------|-----------|-------------|
| Goal ID | Text | Unique identifier |
| Patient ID | Text | Links to Patient_Profiles sheet |
| Goal Type | Text | Weight/Measurement/Energy/Custom |
| Description | Text | Description of the goal |
| Target Value | Number | Target value to achieve |
| Current Value | Number | Current progress toward goal |
| Target Date | Date | When goal should be achieved |
| Is Achieved | Boolean | Whether goal has been met |
| Created Date | Date | When goal was set |
| Timestamp | DateTime | When record was last updated |

## Setup Instructions

1. **Create a new Google Sheet** with the name "Peptide_Tracking_Clinical_Data"

2. **Create 6 tabs** with these exact names:
   - Patient_Profiles
   - Daily_Logs
   - Weekly_Assessments
   - Dosing_Protocols
   - Side_Effect_Reports
   - Progress_Goals

3. **Add column headers** to each sheet using the exact column names listed above

4. **Set up Google Sheets API**:
   - Enable Google Sheets API in Google Cloud Console
   - Create service account credentials
   - Share the spreadsheet with the service account email

5. **Environment Variables** (add to Vercel):
   - `GOOGLE_SHEETS_ID`: The spreadsheet ID from the URL
   - `GOOGLE_SHEETS_API_KEY`: Your Google Sheets API key

## Data Flow

1. **Patient Registration**: Initial data goes to Patient_Profiles sheet
2. **Daily Tracking**: Form submissions go to Daily_Logs sheet
3. **Weekly Analysis**: Calculated data goes to Weekly_Assessments sheet
4. **Protocol Management**: Dosing changes go to Dosing_Protocols sheet
5. **Safety Monitoring**: Side effects go to Side_Effect_Reports sheet
6. **Goal Tracking**: Progress goals go to Progress_Goals sheet

## Benefits for Clinical Research

- **Extended Reach**: Patients self-report from anywhere
- **Real-time Data**: Immediate data collection and analysis
- **Comprehensive Tracking**: Multiple data points per patient
- **Safety Monitoring**: Immediate side effect reporting
- **Compliance Tracking**: Dose adherence monitoring
- **Visual Progress**: Photo and measurement tracking

This structure provides a comprehensive dataset for advancing peptide research while maintaining patient privacy and data security.
