# Peptide Tracking Dashboard Setup

## Overview
This dashboard enables revolutionary patient self-reporting for peptide clinical trials, extending research reach and providing comprehensive real-time data collection.

## Environment Variables Required

### 1. GOOGLE_SPREADSHEET_ID
```bash
GOOGLE_SPREADSHEET_ID=your_google_spreadsheet_id
```

### 2. GOOGLE_SERVICE_ACCOUNT_JSON  
```bash
GOOGLE_SERVICE_ACCOUNT_JSON=your_service_account_json_credentials
```

**Note**: Actual credentials are stored securely in `hidefolder/ENVIRONMENT_SETUP.md` (gitignored)

## Google Sheets Setup

Create a Google Spreadsheet with these 6 sheets and use the column headers from `GOOGLE_SHEETS_SETUP.md`:

1. **Patient_Profiles** - Patient enrollment data
2. **Daily_Logs** - Daily tracking entries  
3. **Weekly_Assessments** - Weekly progress summaries
4. **Dosing_Protocols** - Dosing schedules and escalations
5. **Side_Effect_Reports** - Safety monitoring data
6. **Progress_Goals** - Goal tracking and achievements

## Deployment

### Local Development
1. Install dependencies: `pnpm install`
2. Create `.env.local` with your environment variables
3. Run development server: `pnpm dev`

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Features

- **Patient Onboarding**: Comprehensive enrollment forms
- **Daily Logging**: Weight, measurements, health metrics, dosing
- **Progress Tracking**: Visual charts and trend analysis
- **Safety Monitoring**: Side effect tracking and reporting
- **Dosing Management**: Protocol schedules and instructions
- **Google Sheets Integration**: Real-time data collection for research

## Security

- All sensitive credentials protected in `hidefolder/` (gitignored)
- Service account authentication for secure API access
- Environment variables managed through Vercel for production
- No sensitive data exposed in public repository

This platform revolutionizes clinical trial data collection by enabling patients to self-report from anywhere, providing researchers with unprecedented access to real-world peptide therapy data.
