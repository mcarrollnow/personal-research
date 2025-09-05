'use client'

import { useState, useEffect } from 'react'
import { Send, Users, Filter, MessageSquare, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { broadcastService } from '@/lib/broadcast-service'
import { templateService } from '@/lib/template-service'
import type { MessageTemplate } from '@/types/admin-chat'

interface PatientFilter {
  peptideType?: string
  weekRange?: { min: number; max: number }
  complianceRange?: { min: number; max: number }
  status?: string
  hasUnreadMessages?: boolean
}

interface BroadcastRecipient {
  id: string
  name: string
  email: string
  peptide_type: string
  current_week: number
  compliance_rate: number
  status: string
}

export default function BroadcastPage() {
  const [selectedRecipients, setSelectedRecipients] = useState<BroadcastRecipient[]>([])
  const [allPatients, setAllPatients] = useState<BroadcastRecipient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<BroadcastRecipient[]>([])
  const [filters, setFilters] = useState<PatientFilter>({})
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'general' | 'safety' | 'dosing' | 'progress'>('general')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load patients (mock data for now)
        const mockPatients: BroadcastRecipient[] = [
          {
            id: 'patient-001',
            name: 'John Smith',
            email: 'john@example.com',
            peptide_type: 'Tirzepatide',
            current_week: 8,
            compliance_rate: 95,
            status: 'active'
          },
          {
            id: 'patient-002', 
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            peptide_type: 'Semaglutide',
            current_week: 12,
            compliance_rate: 87,
            status: 'active'
          },
          {
            id: 'patient-003',
            name: 'Mike Davis',
            email: 'mike@example.com',
            peptide_type: 'Tirzepatide',
            current_week: 4,
            compliance_rate: 92,
            status: 'active'
          },
          {
            id: 'patient-004',
            name: 'Lisa Wilson',
            email: 'lisa@example.com',
            peptide_type: 'Liraglutide',
            current_week: 16,
            compliance_rate: 78,
            status: 'active'
          },
          {
            id: 'patient-005',
            name: 'David Brown',
            email: 'david@example.com',
            peptide_type: 'Semaglutide',
            current_week: 6,
            compliance_rate: 89,
            status: 'paused'
          }
        ]
        setAllPatients(mockPatients)
        setFilteredPatients(mockPatients)

        // Load templates
        const templatesResult = await templateService.getTemplates()
        if (templatesResult.success && templatesResult.data) {
          setTemplates(templatesResult.data)
        }
      } catch (error) {
        console.error('Error loading broadcast data:', error)
      }
    }

    loadData()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...allPatients]

    if (filters.peptideType) {
      filtered = filtered.filter(p => p.peptide_type === filters.peptideType)
    }
    if (filters.weekRange) {
      filtered = filtered.filter(p => 
        p.current_week >= filters.weekRange!.min && 
        p.current_week <= filters.weekRange!.max
      )
    }
    if (filters.complianceRange) {
      filtered = filtered.filter(p => 
        p.compliance_rate >= filters.complianceRange!.min && 
        p.compliance_rate <= filters.complianceRange!.max
      )
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    setFilteredPatients(filtered)
  }, [filters, allPatients])

  const handleSelectAll = () => {
    setSelectedRecipients(filteredPatients)
  }

  const handleDeselectAll = () => {
    setSelectedRecipients([])
  }

  const handleToggleRecipient = (patient: BroadcastRecipient) => {
    const isSelected = selectedRecipients.some(r => r.id === patient.id)
    if (isSelected) {
      setSelectedRecipients(prev => prev.filter(r => r.id !== patient.id))
    } else {
      setSelectedRecipients(prev => [...prev, patient])
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setMessage(template.content)
      setSelectedTemplate(templateId)
    }
  }

  const handleSendBroadcast = async () => {
    if (!message.trim() || selectedRecipients.length === 0) return

    setIsSending(true)
    setSendResult(null)

    try {
      const result = await broadcastService.sendBroadcast({
        recipientIds: selectedRecipients.map(r => r.id),
        content: message,
        messageType,
        priority,
        adminId: 'admin-001' // Would come from auth context
      })

      setSendResult(result)
      
      if (result.success) {
        setMessage('')
        setSelectedTemplate('')
        setSelectedRecipients([])
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: 'Failed to send broadcast message'
      })
    } finally {
      setIsSending(false)
    }
  }

  const peptideTypes = [...new Set(allPatients.map(p => p.peptide_type))]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Broadcast Messaging</h1>
        <p className="text-gray-600">Send messages to multiple patients at once</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipients Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Patient Selection</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peptide Type</label>
                    <select
                      value={filters.peptideType || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, peptideType: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Types</option>
                      {peptideTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Week Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.weekRange?.min || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          weekRange: { 
                            min: parseInt(e.target.value) || 0, 
                            max: prev.weekRange?.max || 999 
                          }
                        }))}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.weekRange?.max === 999 ? '' : filters.weekRange?.max || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          weekRange: { 
                            min: prev.weekRange?.min || 0, 
                            max: parseInt(e.target.value) || 999 
                          }
                        }))}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compliance %</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.complianceRange?.min || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          complianceRange: { 
                            min: parseInt(e.target.value) || 0, 
                            max: prev.complianceRange?.max || 100 
                          }
                        }))}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.complianceRange?.max === 100 ? '' : filters.complianceRange?.max || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          complianceRange: { 
                            min: prev.complianceRange?.min || 0, 
                            max: parseInt(e.target.value) || 100 
                          }
                        }))}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {filteredPatients.length} patients match your criteria • {selectedRecipients.length} selected
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPatients.map((patient) => {
                  const isSelected = selectedRecipients.some(r => r.id === patient.id)
                  return (
                    <div
                      key={patient.id}
                      onClick={() => handleToggleRecipient(patient)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRecipient(patient)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-500">{patient.email}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-900">{patient.peptide_type}</p>
                          <p className="text-gray-500">Week {patient.current_week} • {patient.compliance_rate}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Message Composition */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Compose Message</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Templates</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select a template...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="general">General</option>
                    <option value="safety">Safety</option>
                    <option value="dosing">Dosing</option>
                    <option value="progress">Progress</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{message.length} characters</p>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendBroadcast}
                disabled={!message.trim() || selectedRecipients.length === 0 || isSending}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send to {selectedRecipients.length} patients</span>
                  </>
                )}
              </button>

              {/* Send Result */}
              {sendResult && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  sendResult.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {sendResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{sendResult.message}</span>
                  <button
                    onClick={() => setSendResult(null)}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Selected Recipients Summary */}
          {selectedRecipients.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  Selected Recipients ({selectedRecipients.length})
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedRecipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{recipient.name}</span>
                      <button
                        onClick={() => handleToggleRecipient(recipient)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
