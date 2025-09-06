'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DashboardCard from '@/components/dashboard/card'
import DashboardStat from '@/components/dashboard/stat'
import {
  Bot,
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  Users,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { automationService, type AutomationRule, type MessageTemplate } from '@/lib/automation-service'

export default function AutomationPage() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateRuleDialog, setShowCreateRuleDialog] = useState(false)
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)

  // New rule form state
  const [newRule, setNewRule] = useState({
    name: '',
    triggerType: 'dosing_reminder' as const,
    conditions: {},
    actionType: 'send_message' as const,
    templateId: '',
    customMessage: '',
    priority: 'normal' as const,
    recipientType: 'patient' as const,
    schedule: {
      frequency: 'daily' as const,
      time: '09:00',
      daysOfWeek: [1]
    },
    isActive: true
  })

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'general',
    subject: '',
    content: '',
    variables: [] as string[],
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [rules, templates] = await Promise.all([
        automationService.getAutomationRules(),
        automationService.getMessageTemplates()
      ])
      setAutomationRules(rules)
      setMessageTemplates(templates)
    } catch (error) {
      console.error('Error loading automation data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createAutomationRule = async () => {
    try {
      const ruleData = {
        name: newRule.name,
        trigger: {
          type: newRule.triggerType,
          conditions: newRule.conditions,
          schedule: newRule.schedule
        },
        action: {
          type: newRule.actionType,
          templateId: newRule.templateId || undefined,
          customMessage: newRule.customMessage || undefined,
          priority: newRule.priority,
          recipients: {
            type: newRule.recipientType
          }
        },
        isActive: newRule.isActive
      }

      await automationService.createAutomationRule(ruleData)
      await loadData()
      setShowCreateRuleDialog(false)
      resetNewRuleForm()
    } catch (error) {
      console.error('Error creating automation rule:', error)
    }
  }

  const createMessageTemplate = async () => {
    try {
      await automationService.createMessageTemplate(newTemplate)
      await loadData()
      setShowCreateTemplateDialog(false)
      resetNewTemplateForm()
    } catch (error) {
      console.error('Error creating message template:', error)
    }
  }

  const toggleRuleActive = async (ruleId: string, isActive: boolean) => {
    try {
      // Update local state immediately
      setAutomationRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive } : rule
      ))
      // TODO: Update in database
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const resetNewRuleForm = () => {
    setNewRule({
      name: '',
      triggerType: 'dosing_reminder',
      conditions: {},
      actionType: 'send_message',
      templateId: '',
      customMessage: '',
      priority: 'normal',
      recipientType: 'patient',
      schedule: {
        frequency: 'daily',
        time: '09:00',
        daysOfWeek: [1]
      },
      isActive: true
    })
  }

  const resetNewTemplateForm = () => {
    setNewTemplate({
      name: '',
      category: 'general',
      subject: '',
      content: '',
      variables: [],
      isActive: true
    })
  }

  const getActiveRulesCount = () => automationRules.filter(rule => rule.isActive).length
  const getTemplatesCount = () => messageTemplates.length
  const getRecentExecutions = () => {
    return automationRules
      .filter(rule => rule.lastExecuted)
      .sort((a, b) => new Date(b.lastExecuted!).getTime() - new Date(a.lastExecuted!).getTime())
      .length
  }

  const formatTriggerType = (type: string) => {
    const types = {
      patient_onboarded: 'Patient Onboarded',
      dosing_reminder: 'Dosing Reminder',
      weekly_checkin: 'Weekly Check-in',
      milestone_reached: 'Milestone Reached',
      safety_alert: 'Safety Alert',
      inactive_patient: 'Inactive Patient'
    }
    return types[type as keyof typeof types] || type
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading automation settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Center</h1>
          <p className="text-gray-600 mt-1">
            Manage automated messaging rules and templates for enhanced patient engagement
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={showCreateTemplateDialog} onOpenChange={setShowCreateTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Message Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Template Name</label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Welcome Message"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="dosing">Dosing</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="motivation">Motivation</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Message Content</label>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your message template here. Use {{patientName}}, {{currentWeek}}, etc. for dynamic content."
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createMessageTemplate}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateRuleDialog} onOpenChange={setShowCreateRuleDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Automation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Rule Name</label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Daily Dosing Reminder"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trigger</label>
                    <Select value={newRule.triggerType} onValueChange={(value: any) => setNewRule(prev => ({ ...prev, triggerType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient_onboarded">Patient Onboarded</SelectItem>
                        <SelectItem value="dosing_reminder">Dosing Reminder</SelectItem>
                        <SelectItem value="weekly_checkin">Weekly Check-in</SelectItem>
                        <SelectItem value="milestone_reached">Milestone Reached</SelectItem>
                        <SelectItem value="inactive_patient">Inactive Patient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={newRule.priority} onValueChange={(value: any) => setNewRule(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(newRule.triggerType === 'dosing_reminder' || newRule.triggerType === 'weekly_checkin') && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Schedule Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Frequency</label>
                        <Select value={newRule.schedule.frequency} onValueChange={(value: any) => setNewRule(prev => ({ ...prev, schedule: { ...prev.schedule, frequency: value } }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Time</label>
                        <Input
                          type="time"
                          value={newRule.schedule.time}
                          onChange={(e) => setNewRule(prev => ({ ...prev, schedule: { ...prev.schedule, time: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Message Template</label>
                  <Select value={newRule.templateId} onValueChange={(value) => setNewRule(prev => ({ ...prev, templateId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template or write custom message below" />
                    </SelectTrigger>
                    <SelectContent>
                      {messageTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!newRule.templateId && (
                  <div>
                    <label className="text-sm font-medium">Custom Message</label>
                    <Textarea
                      value={newRule.customMessage}
                      onChange={(e) => setNewRule(prev => ({ ...prev, customMessage: e.target.value }))}
                      placeholder="Enter custom message content..."
                      rows={4}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newRule.isActive}
                    onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
                  />
                  <label className="text-sm font-medium">Active</label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateRuleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAutomationRule}>
                    Create Automation
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
          title="Active Rules"
          value={getActiveRulesCount()}
          icon={Bot}
          intent="primary"
          subtitle={`${automationRules.length} total rules`}
        />
        
        <DashboardStat
          title="Message Templates"
          value={getTemplatesCount()}
          icon={MessageSquare}
          intent="secondary"
          subtitle="ready to use"
        />
        
        <DashboardStat
          title="Recent Executions"
          value={getRecentExecutions()}
          icon={Zap}
          intent="success"
          subtitle="in the last 24h"
        />
        
        <DashboardStat
          title="Success Rate"
          value={95}
          icon={CheckCircle}
          intent="success"
          subtitle="% successful deliveries"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {formatTriggerType(rule.trigger.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => toggleRuleActive(rule.id, checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>Priority: {rule.action.priority}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Recipients: {rule.action.recipients.type}</span>
                      </div>
                      {rule.trigger.schedule && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{rule.trigger.schedule.frequency} at {rule.trigger.schedule.time}</span>
                        </div>
                      )}
                    </div>
                    {rule.lastExecuted && (
                      <p className="text-xs text-gray-500">
                        Last executed: {new Date(rule.lastExecuted).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {messageTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {template.content}
                    </p>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard
              title="Automation Performance"
              subtitle="Success rate and delivery statistics"
              icon={Target}
              intent="primary"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Messages Sent Today</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Successful Deliveries</span>
                  <span className="font-semibold text-green-600">121 (95.3%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed Deliveries</span>
                  <span className="font-semibold text-red-600">6 (4.7%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Response Rate</span>
                  <span className="font-semibold">68%</span>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Most Active Rules"
              subtitle="Top performing automation rules"
              icon={Zap}
              intent="secondary"
            >
              <div className="space-y-3">
                {automationRules.filter(rule => rule.isActive).slice(0, 5).map(rule => (
                  <div key={rule.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{rule.name}</span>
                    <Badge variant="outline">
                      {rule.lastExecuted ? 'Recent' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
