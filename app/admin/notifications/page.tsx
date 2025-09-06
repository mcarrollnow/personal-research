'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DashboardCard from '@/components/dashboard/card'
import DashboardStat from '@/components/dashboard/stat'
import {
  Bell,
  Settings,
  Mail,
  Smartphone,
  Monitor,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Volume2,
  VolumeX,
  Moon,
  Sun
} from 'lucide-react'
import { notificationService, type NotificationPreferences, type NotificationQueue, type EscalationRule } from '@/lib/notification-service'
import { adminAuthService } from '@/lib/admin-auth'

export default function NotificationsPage() {
  const [currentAdmin] = useState(adminAuthService.getCurrentAdmin())
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [notificationQueue, setNotificationQueue] = useState<NotificationQueue[]>([])
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateRuleDialog, setShowCreateRuleDialog] = useState(false)

  // Test notification state
  const [testNotification, setTestNotification] = useState({
    type: 'browser' as const,
    title: 'Test Notification',
    message: 'This is a test notification to verify your settings.'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!currentAdmin) return
    
    setIsLoading(true)
    try {
      const [prefs, queue] = await Promise.all([
        notificationService.getUserNotificationPreferences(currentAdmin.adminId, 'admin'),
        // notificationService.getNotificationQueue(), // TODO: Implement this method
      ])
      
      setPreferences(prefs)
      // setNotificationQueue(queue)
      
      // Mock data for demonstration
      setNotificationQueue([
        {
          id: '1',
          recipientId: currentAdmin.adminId,
          recipientType: 'admin',
          type: 'browser',
          priority: 'urgent',
          title: 'Safety Alert',
          message: 'Patient reported severe side effects',
          scheduledFor: new Date().toISOString(),
          status: 'sent',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          sentAt: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: '2',
          recipientId: currentAdmin.adminId,
          recipientType: 'admin',
          type: 'email',
          priority: 'normal',
          title: 'Daily Digest',
          message: 'Your daily patient activity summary',
          scheduledFor: new Date().toISOString(),
          status: 'pending',
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ])
    } catch (error) {
      console.error('Error loading notification data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return
    
    const updatedPreferences = { ...preferences, ...updates }
    setPreferences(updatedPreferences)
    
    try {
      await notificationService.updateNotificationPreferences(updatedPreferences)
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  const sendTestNotification = async () => {
    try {
      await notificationService.sendBrowserNotification(
        testNotification.title,
        testNotification.message,
        {
          icon: '/icons/notification-icon.png',
          requireInteraction: false
        }
      )
    } catch (error) {
      console.error('Error sending test notification:', error)
    }
  }

  const getStatusColor = (status: NotificationQueue['status']) => {
    switch (status) {
      case 'sent': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'cancelled': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: NotificationQueue['status']) => {
    switch (status) {
      case 'sent': return <Badge variant="default">Sent</Badge>
      case 'pending': return <Badge variant="secondary">Pending</Badge>
      case 'failed': return <Badge variant="destructive">Failed</Badge>
      case 'cancelled': return <Badge variant="outline">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'normal': return 'text-blue-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bell className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading notification settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-1">
            Configure your notification preferences and manage alert settings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={sendTestNotification} className="gap-2">
            <Bell className="h-4 w-4" />
            Test Notification
          </Button>
          
          <Dialog open={showCreateRuleDialog} onOpenChange={setShowCreateRuleDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Escalation Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Escalation rules are not yet implemented in this demo.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowCreateRuleDialog(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStat
          title="Notifications Today"
          value={notificationQueue.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length}
          icon={Bell}
          intent="primary"
          subtitle="total notifications"
        />
        
        <DashboardStat
          title="Success Rate"
          value={Math.round((notificationQueue.filter(n => n.status === 'sent').length / notificationQueue.length) * 100)}
          icon={CheckCircle}
          intent="success"
          subtitle="% delivered successfully"
        />
        
        <DashboardStat
          title="Urgent Alerts"
          value={notificationQueue.filter(n => n.priority === 'urgent').length}
          icon={AlertTriangle}
          intent="warning"
          subtitle="requiring immediate attention"
        />
        
        <DashboardStat
          title="Pending Queue"
          value={notificationQueue.filter(n => n.status === 'pending').length}
          icon={Clock}
          intent="secondary"
          subtitle="awaiting delivery"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Browser Notifications</p>
                      <p className="text-sm text-gray-600">Real-time alerts in your browser</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.browserNotifications}
                    onCheckedChange={(checked) => updatePreferences({ browserNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Important alerts via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreferences({ emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Critical alerts via text message</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => updatePreferences({ smsNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Daily Digest</p>
                      <p className="text-sm text-gray-600">Daily summary of patient activity</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.dailyDigest}
                    onCheckedChange={(checked) => updatePreferences({ dailyDigest: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">Urgent Only Mode</p>
                      <p className="text-sm text-gray-600">Only receive urgent notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.urgentOnly}
                    onCheckedChange={(checked) => updatePreferences({ urgentOnly: checked })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="font-medium">Quiet Hours</p>
                        <p className="text-sm text-gray-600">Suppress non-urgent notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.quietHours.enabled}
                      onCheckedChange={(checked) => updatePreferences({ 
                        quietHours: { ...preferences.quietHours, enabled: checked }
                      })}
                    />
                  </div>
                  
                  {preferences.quietHours.enabled && (
                    <div className="ml-8 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Start Time</label>
                        <Input
                          type="time"
                          value={preferences.quietHours.startTime}
                          onChange={(e) => updatePreferences({
                            quietHours: { ...preferences.quietHours, startTime: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">End Time</label>
                        <Input
                          type="time"
                          value={preferences.quietHours.endTime}
                          onChange={(e) => updatePreferences({
                            quietHours: { ...preferences.quietHours, endTime: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Notification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Test Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={testNotification.type} onValueChange={(value: any) => setTestNotification(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Browser</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={testNotification.title}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Input
                    value={testNotification.message}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={sendTestNotification} className="gap-2">
                  <Bell className="h-4 w-4" />
                  Send Test Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Notification History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationQueue.map((notification) => (
                  <div key={notification.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {getStatusBadge(notification.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Type: {notification.type}</span>
                        <span>Created: {new Date(notification.createdAt).toLocaleString()}</span>
                        {notification.sentAt && (
                          <span>Sent: {new Date(notification.sentAt).toLocaleString()}</span>
                        )}
                      </div>
                      {notification.error && (
                        <p className="text-xs text-red-600 mt-1">Error: {notification.error}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {notificationQueue.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications in history</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalation" className="space-y-6">
          <DashboardCard
            title="Escalation Rules"
            subtitle="Automated escalation for urgent situations"
            icon={AlertTriangle}
            intent="warning"
          >
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Escalation rules are not yet implemented</p>
              <p className="text-sm">This feature will automatically escalate urgent messages based on keywords and response time thresholds.</p>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
