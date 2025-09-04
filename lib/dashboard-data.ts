// Dashboard Data Service - Fetches real data from Google Sheets and formats it for display
import { googleSheetsService } from './google-sheets';
import { patientAuthService } from './patient-auth';

export interface DashboardData {
  stats: {
    totalWeightLoss: number;
    weeklyAverage: number;
    consistency: number;
    currentWeight: number;
    startingWeight: number;
    weeksActive: number;
    recentTrend: number;
  };
  chartData: {
    week: Array<{
      date: string;
      weight: number;
      goal: number;
      trend: number;
    }>;
  };
  recentEntries: Array<{
    date: string;
    weight: string;
    status: string;
  }>;
}

class DashboardDataService {
  private getPatientId(): string {
    // Get current authenticated patient ID
    const patientId = patientAuthService.getCurrentPatientId();
    return patientId || "PATIENT-001"; // Fallback for demo
  }

  // Calculate dashboard statistics from Google Sheets data
  async getDashboardStats(): Promise<DashboardData['stats']> {
    try {
      // Get patient profile for baseline data
      const patientId = this.getPatientId();
      const profileData = await googleSheetsService.getData('patientProfiles', patientId);
      const dailyLogs = await googleSheetsService.getData('dailyLogs', patientId);

      if (!profileData.length || !dailyLogs.length) {
        // Return default values if no data
        return {
          totalWeightLoss: 0,
          weeklyAverage: 0,
          consistency: 0,
          currentWeight: 0,
          startingWeight: 0,
          weeksActive: 0,
          recentTrend: 0
        };
      }

      // Parse data (assuming Google Sheets returns arrays where each row is an array)
      const profile = profileData[0]; // First row for this patient
      const startingWeight = parseFloat(profile[7]) || 0; // Starting Weight column
      
      // Get recent weight entries (sorted by date)
      const weightEntries = dailyLogs
        .filter(log => log[3] && !isNaN(parseFloat(log[3]))) // Filter valid weight entries
        .map(log => ({
          date: log[2], // Date column
          weight: parseFloat(log[3]), // Weight column
          doseTaken: log[11] // Dose Taken column
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (weightEntries.length === 0) {
        return {
          totalWeightLoss: 0,
          weeklyAverage: 0,
          consistency: 0,
          currentWeight: startingWeight,
          startingWeight,
          weeksActive: 0,
          recentTrend: 0
        };
      }

      const currentWeight = weightEntries[weightEntries.length - 1].weight;
      const totalWeightLoss = startingWeight - currentWeight;
      
      // Calculate weeks active
      const firstEntry = new Date(weightEntries[0].date);
      const lastEntry = new Date(weightEntries[weightEntries.length - 1].date);
      const weeksActive = Math.ceil((lastEntry.getTime() - firstEntry.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      const weeklyAverage = weeksActive > 0 ? totalWeightLoss / weeksActive : 0;
      
      // Calculate recent trend (last 7 days vs previous 7 days)
      const recentEntries = weightEntries.slice(-7);
      const previousEntries = weightEntries.slice(-14, -7);
      
      let recentTrend = 0;
      if (recentEntries.length > 0 && previousEntries.length > 0) {
        const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.weight, 0) / recentEntries.length;
        const previousAvg = previousEntries.reduce((sum, entry) => sum + entry.weight, 0) / previousEntries.length;
        recentTrend = previousAvg - recentAvg; // Positive = weight loss, Negative = weight gain
      }
      
      // Calculate consistency (doses taken vs total days)
      const dosesCompliant = dailyLogs.filter(log => log[11] === 'yes').length; // Full doses taken
      const totalDays = dailyLogs.length;
      const consistency = totalDays > 0 ? (dosesCompliant / totalDays) * 100 : 0;

      return {
        totalWeightLoss: Math.round(totalWeightLoss * 10) / 10,
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        consistency: Math.round(consistency),
        currentWeight,
        startingWeight,
        weeksActive,
        recentTrend: Math.round(recentTrend * 10) / 10 // Add trend data
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
              return {
          totalWeightLoss: 0,
          weeklyAverage: 0,
          consistency: 0,
          currentWeight: 0,
          startingWeight: 0,
          weeksActive: 0,
          recentTrend: 0
        };
    }
  }

  // Get chart data for weight loss visualization
  async getChartData(): Promise<DashboardData['chartData']> {
    try {
      const patientId = this.getPatientId();
      const dailyLogs = await googleSheetsService.getData('dailyLogs', patientId);
      const profileData = await googleSheetsService.getData('patientProfiles', patientId);
      
      if (!dailyLogs.length || !profileData.length) {
        return { week: [] };
      }

      const goalWeight = parseFloat(profileData[0][8]) || 0; // Goal Weight column
      
      // Process daily logs into weekly data points
      const weightEntries = dailyLogs
        .filter(log => log[3] && !isNaN(parseFloat(log[3])))
        .map(log => ({
          date: log[2],
          weight: parseFloat(log[3])
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Group by week and create chart data
      const weeklyData = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekEntries = weightEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });
        
        const averageWeight = weekEntries.length > 0 
          ? weekEntries.reduce((sum, entry) => sum + entry.weight, 0) / weekEntries.length
          : null;
        
        if (averageWeight !== null) {
          weeklyData.push({
            date: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            weight: Math.round(averageWeight * 1000), // Scale for chart display
            goal: goalWeight * 1000, // Scale for chart display  
            trend: (weightEntries[0]?.weight || 0) * 1000 // Scale for chart display
          });
        }
      }

      return { week: weeklyData };
    } catch (error) {
      console.error('Error getting chart data:', error);
      return { week: [] };
    }
  }

  // Get recent entries for display
  async getRecentEntries(): Promise<DashboardData['recentEntries']> {
    try {
      const patientId = this.getPatientId();
      const dailyLogs = await googleSheetsService.getData('dailyLogs', patientId);
      
      return dailyLogs
        .slice(-7) // Last 7 entries
        .reverse() // Most recent first
        .map((log, index) => ({
          date: this.formatDate(log[2]), // Date column
          weight: `${log[3]} lbs`, // Weight column
          status: log[11] === 'yes' ? 'Complete' : log[11] === 'partial' ? 'Partial' : 'Missed' // Dose taken column
        }));
    } catch (error) {
      console.error('Error getting recent entries:', error);
      return [];
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const daysAgo = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
      return `${daysAgo} days ago`;
    }
  }

  // Get complete dashboard data
  async getDashboardData(): Promise<DashboardData> {
    const [stats, chartData, recentEntries] = await Promise.all([
      this.getDashboardStats(),
      this.getChartData(), 
      this.getRecentEntries()
    ]);

    return {
      stats,
      chartData,
      recentEntries
    };
  }
}

export const dashboardDataService = new DashboardDataService();
export default DashboardDataService;
