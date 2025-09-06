'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DashboardCard from '@/components/dashboard/card'
import DashboardStat from '@/components/dashboard/stat'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react'
import { analyticsService, type MessageAnalytics, type PatientEngagement, type SupportWorkload, type CommonQuestions } from '@/lib/analytics-service'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [messageAnalytics, setMessageAnalytics] = useState<MessageAnalytics | null>(null)
  const [patientEngagement, setPatientEngagement] = useState<PatientEngagement[]>([])
  const [supportWorkload, setSupportWorkload] = useState<SupportWorkload[]>([])
  const [commonQuestions, setCommonQuestions] = useState<CommonQuestions[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const period = analyticsService.getPeriod(selectedPeriod)
      
      const [analytics, engagement, workload, questions] = await Promise.all([
        analyticsService.getMessageAnalytics(period),
        analyticsService.getPatientEngagement(period),
        analyticsService.getSupportWorkload(period),
        analyticsService.getCommonQuestions(period)
      ])

      setMessageAnalytics(analytics)
      setPatientEngagement(engagement)
      setSupportWorkload(workload)
      setCommonQuestions(questions)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await loadAnalyticsData()
    setIsRefreshing(false)
  }

  const exportData = () => {
    const data = {
      period: selectedPeriod,
      messageAnalytics,
      patientEngagement,
      supportWorkload,
      commonQuestions,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '24h': return 'Last 24 Hours'
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      default: return 'Last 7 Days'
    }
  }

  const formatEngagementData = () => {
    return patientEngagement.slice(0, 10).map(patient => ({
      name: patient.patientName.split(' ')[0], // First name only
      messages: patient.messageCount,
      engagement: patient.engagementScore,
      responseRate: patient.responseRate
    }))
  }

  const formatWorkloadData = () => {
    return supportWorkload.map(admin => ({
      name: admin.adminName.split(' ')[0], // First name only
      messages: admin.messagesHandled,
      avgResponse: admin.averageResponseTime,
      conversations: admin.activeConversations,
      workload: admin.workloadScore
    }))
  }

  const formatCategoryData = () => {
    const categoryCount = commonQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + q.frequency
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryCount).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into patient support and messaging performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStat
          title="Total Messages"
          value={messageAnalytics?.totalMessages || 0}
          icon={MessageSquare}
          intent="primary"
          subtitle={`${getPeriodLabel(selectedPeriod)}`}
        />
        
        <DashboardStat
          title="Avg Response Time"
          value={messageAnalytics?.averageResponseTime || 0}
          icon={Clock}
          intent="secondary"
          subtitle="minutes"
        />
        
        <DashboardStat
          title="Response Rate"
          value={messageAnalytics?.responseRate || 0}
          icon={CheckCircle}
          intent="success"
          subtitle="%"
        />
        
        <DashboardStat
          title="Urgent Messages"
          value={messageAnalytics?.urgentMessages || 0}
          icon={AlertTriangle}
          intent="warning"
          subtitle={`${messageAnalytics?.urgentMessages || 0} requiring attention`}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Patient Engagement</TabsTrigger>
          <TabsTrigger value="workload">Support Workload</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message Volume Chart */}
            <DashboardCard
              title="Message Volume Trends"
              subtitle="Daily message volume over selected period"
              icon={TrendingUp}
              intent="primary"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatEngagementData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>

            {/* Category Distribution */}
            <DashboardCard
              title="Message Categories"
              subtitle="Distribution of message types"
              icon={Target}
              intent="secondary"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>
          </div>

          {/* Conversation Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardStat
              title="Active Conversations"
              value={messageAnalytics?.activeConversations || 0}
              icon={Activity}
              intent="primary"
              subtitle="ongoing discussions"
            />
            
            <DashboardStat
              title="Resolved Conversations"
              value={messageAnalytics?.resolvedConversations || 0}
              icon={CheckCircle}
              intent="success"
              subtitle="completed successfully"
            />
            
            <DashboardStat
              title="Resolution Rate"
              value={messageAnalytics ? Math.round((messageAnalytics.resolvedConversations / (messageAnalytics.activeConversations + messageAnalytics.resolvedConversations)) * 100) : 0}
              icon={Target}
              intent="secondary"
              subtitle="% of conversations resolved"
            />
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <DashboardCard
            title="Patient Engagement Metrics"
            subtitle="Top 10 most engaged patients by message activity"
            icon={Users}
            intent="primary"
          >
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatEngagementData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#3B82F6" name="Messages" />
                  <Bar dataKey="engagement" fill="#10B981" name="Engagement Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Patient Engagement Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patient Engagement Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Patient</th>
                      <th className="text-left py-3 px-4">Messages</th>
                      <th className="text-left py-3 px-4">Last Activity</th>
                      <th className="text-left py-3 px-4">Response Rate</th>
                      <th className="text-left py-3 px-4">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientEngagement.slice(0, 10).map((patient) => (
                      <tr key={patient.patientId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{patient.patientName}</td>
                        <td className="py-3 px-4">{patient.messageCount}</td>
                        <td className="py-3 px-4">
                          {new Date(patient.lastMessageDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={patient.responseRate > 80 ? 'default' : patient.responseRate > 60 ? 'secondary' : 'destructive'}>
                            {patient.responseRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${patient.engagementScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{patient.engagementScore}/100</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload" className="space-y-6">
          <DashboardCard
            title="Support Team Workload"
            subtitle="Admin performance and message handling metrics"
            icon={Activity}
            intent="secondary"
          >
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatWorkloadData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#8B5CF6" name="Messages Handled" />
                  <Bar dataKey="avgResponse" fill="#F59E0B" name="Avg Response (min)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Workload Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Admin Performance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Admin</th>
                      <th className="text-left py-3 px-4">Messages Handled</th>
                      <th className="text-left py-3 px-4">Avg Response Time</th>
                      <th className="text-left py-3 px-4">Active Conversations</th>
                      <th className="text-left py-3 px-4">Workload Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportWorkload.map((admin) => (
                      <tr key={admin.adminId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{admin.adminName}</td>
                        <td className="py-3 px-4">{admin.messagesHandled}</td>
                        <td className="py-3 px-4">
                          <Badge variant={admin.averageResponseTime < 30 ? 'default' : admin.averageResponseTime < 60 ? 'secondary' : 'destructive'}>
                            {admin.averageResponseTime}m
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{admin.activeConversations}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${admin.workloadScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{admin.workloadScore}/100</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Common Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Most Common Questions & Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commonQuestions.map((question, index) => (
                  <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {question.frequency} occurrences
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{question.question}</h4>
                      {question.suggestedTemplate && (
                        <p className="text-sm text-gray-600 italic">
                          Suggested response: "{question.suggestedTemplate}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Avg Response</div>
                      <div className="font-medium">{question.averageResponseTime}m</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Response Time Performance</p>
                    <p className="text-sm text-gray-600">
                      Average response time is {messageAnalytics?.averageResponseTime || 0} minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Patient Engagement</p>
                    <p className="text-sm text-gray-600">
                      {patientEngagement.filter(p => p.engagementScore > 70).length} highly engaged patients
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Support Efficiency</p>
                    <p className="text-sm text-gray-600">
                      {messageAnalytics?.responseRate || 0}% response rate achieved
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Template Opportunities</p>
                    <p className="text-sm text-gray-600">
                      Create templates for {commonQuestions.slice(0, 3).map(q => q.category).join(', ')} questions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Workload Distribution</p>
                    <p className="text-sm text-gray-600">
                      Consider redistributing cases for better balance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Automation Potential</p>
                    <p className="text-sm text-gray-600">
                      {commonQuestions.filter(q => q.frequency > 5).length} questions suitable for automation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
