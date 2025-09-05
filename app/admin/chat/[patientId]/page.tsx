'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Phone, Video, MoreVertical, AlertTriangle, Clock, User, Activity, Calendar, Weight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ChatConversation } from '@/components/chat/chat-conversation'
import { useChatState } from '@/components/chat/use-chat-state'
import { chatService } from '@/lib/chat-service'
import { messagingService } from '@/lib/messaging-service'
import type { PatientContext } from '@/types/admin-chat'

interface PatientChatPageProps {}

export default function PatientChatPage({}: PatientChatPageProps) {
  const params = useParams()
  const patientId = params.patientId as string
  
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null)
  const [isLoadingPatient, setIsLoadingPatient] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  // Initialize chat state for this specific patient
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    isLoading,
    error,
    initializeChat
  } = useChatState()

  // Load patient context and conversation
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setIsLoadingPatient(true)
        
        // Initialize chat service as admin
        await initializeChat('admin-001', 'admin')
        
        // Load patient context (mock data for now - would come from patient service)
        const mockPatientContext: PatientContext = {
          id: patientId,
          name: `Patient ${patientId.slice(-3)}`,
          email: `patient${patientId.slice(-3)}@example.com`,
          peptide_type: 'Tirzepatide',
          start_date: '2024-11-01',
          current_week: 8,
          last_weight: 185.2,
          compliance_rate: 94,
          recent_side_effects: ['Mild nausea', 'Fatigue'],
          status: 'active'
        }
        setPatientContext(mockPatientContext)
        
        // Find or create conversation with this patient
        const patientConversation = conversations.find(conv => 
          conv.participants.some(p => p.id === patientId)
        )
        
        if (patientConversation) {
          setConversationId(patientConversation.id)
          setActiveConversation(patientConversation.id)
        } else {
          // Create new conversation
          const result = await messagingService.createConversation(patientId, 'admin-001')
          if (result.success && result.data) {
            setConversationId(result.data.id)
            // Reload conversations to include the new one
            await chatService.getConversations()
          }
        }
        
      } catch (error) {
        console.error('Error loading patient data:', error)
      } finally {
        setIsLoadingPatient(false)
      }
    }

    if (patientId) {
      loadPatientData()
    }
  }, [patientId, conversations, initializeChat, setActiveConversation])

  const handleSendMessage = async (content: string, messageType?: string, priority?: string) => {
    if (!conversationId) return
    
    await sendMessage(conversationId, content, {
      messageType: messageType as any || 'general',
      priority: priority as any || 'normal'
    })
  }

  const quickActions = [
    {
      label: 'Dosing Reminder',
      action: () => handleSendMessage('Please remember to take your medication as prescribed. Let me know if you have any questions about timing or dosage.', 'dosing', 'normal')
    },
    {
      label: 'Safety Check',
      action: () => handleSendMessage('How are you feeling today? Please let me know if you\'re experiencing any concerning side effects.', 'safety', 'high')
    },
    {
      label: 'Progress Check',
      action: () => handleSendMessage('Great progress this week! How are you feeling about your results so far?', 'progress', 'normal')
    },
    {
      label: 'Schedule Follow-up',
      action: () => handleSendMessage('Let\'s schedule a follow-up appointment to discuss your progress. What times work best for you this week?', 'general', 'normal')
    }
  ]

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    )
  }

  if (!patientContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Patient not found</p>
          <Link href="/admin/patients" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to Patients
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/patients" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{patientContext.name}</h1>
                  <p className="text-sm text-gray-500">{patientContext.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  patientContext.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {patientContext.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Video className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-3 overflow-x-auto">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Conversation */}
        <div className="flex-1 overflow-hidden">
          {activeConversation && conversationId ? (
            <ChatConversation 
              conversationId={conversationId}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              error={error}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">Start a conversation with {patientContext.name}</p>
                <button 
                  onClick={() => handleSendMessage('Hello! How can I help you today?')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send First Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Context Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
          
          {/* Patient Overview */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Peptide</span>
              <span className="text-sm font-medium text-gray-900">{patientContext.peptide_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Program Week</span>
              <span className="text-sm font-medium text-gray-900">Week {patientContext.current_week}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Start Date</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(patientContext.start_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900">Key Metrics</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Weight className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Last Weight</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{patientContext.last_weight} lbs</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Compliance Rate</span>
                </div>
                <span className={`text-sm font-medium ${
                  patientContext.compliance_rate >= 90 ? 'text-green-600' : 
                  patientContext.compliance_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {patientContext.compliance_rate}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent Side Effects */}
          {patientContext.recent_side_effects.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900">Recent Side Effects</h3>
              <div className="space-y-2">
                {patientContext.recent_side_effects.map((effect, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-700">{effect}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                href={`/admin/patients/${patientId}/progress`}
                className="flex items-center space-x-2 p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Activity className="h-4 w-4" />
                <span>View Progress</span>
              </Link>
              <Link 
                href={`/admin/patients/${patientId}/safety`}
                className="flex items-center space-x-2 p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Safety Reports</span>
              </Link>
              <Link 
                href={`/admin/patients/${patientId}/schedule`}
                className="flex items-center space-x-2 p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span>Schedule Follow-up</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
