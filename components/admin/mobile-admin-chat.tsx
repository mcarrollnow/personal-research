"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { mobileOptimizationService, type MobileOptimization } from '@/lib/mobile-optimization'
import { messagingService } from '@/lib/messaging-service'
import { patientAuthService } from '@/lib/patient-auth'

interface MobileAdminChatProps {
  patientId?: string
  adminId?: string
}

export default function MobileAdminChat({ patientId, adminId }: MobileAdminChatProps) {
  const [mobileOptimization, setMobileOptimization] = useState<MobileOptimization>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenSize: 'large',
    touchEnabled: false
  })
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    setIsClient(true)
    mobileOptimizationService.initialize()
    setMobileOptimization(mobileOptimizationService.getCurrentOptimization())
    const unsubscribe = mobileOptimizationService.subscribe(setMobileOptimization)
    return unsubscribe
  }, [])

  // Use static optimizations until client hydration
  const chatOptimizations = isClient ? mobileOptimizationService.optimizeAdminChatForMobile() : {
    containerClass: 'flex h-screen',
    headerClass: 'flex-shrink-0 p-4 border-b',
    sidebarClass: 'w-80 flex-shrink-0',
    messageClass: 'text-sm leading-relaxed p-4 rounded-lg max-w-[70%]',
    inputClass: 'min-h-[40px] text-sm'
  }
  const touchOptimizations = isClient ? mobileOptimizationService.getTouchOptimizations() : {
    buttonSize: 'h-10 px-4',
    spacing: 'space-y-2',
    fontSize: 'text-sm',
    iconSize: 'w-4 h-4'
  }
  const mobileNavigation = isClient ? mobileOptimizationService.getMobileNavigation() : {
    showBottomNav: false,
    collapseSidebar: false,
    useHamburgerMenu: false,
    stackNavigation: false
  }
  const inputOptimizations = isClient ? mobileOptimizationService.getMessageInputOptimizations() : {
    inputMode: 'text',
    autoComplete: 'off',
    spellCheck: true,
    autoCapitalize: 'sentences',
    enterKeyHint: 'send'
  }
  const mobileClasses = isClient ? mobileOptimizationService.getMobileSpecificClasses() : {
    container: 'desktop-container px-8 py-6',
    navigation: 'desktop-nav relative',
    content: 'desktop-content',
    sidebar: 'desktop-sidebar w-80 flex-shrink-0',
    modal: 'desktop-modal fixed inset-0 z-50 flex items-center justify-center p-8'
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const currentAdminId = adminId || 'ADMIN-001'
      const currentPatientId = patientId || 'PATIENT-001'
      
      // Add optimistic message
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        content: newMessage,
        senderId: currentAdminId,
        recipientId: currentPatientId,
        timestamp: new Date().toISOString(),
        isOptimistic: true
      }
      
      setMessages(prev => [...prev, optimisticMessage])
      setNewMessage('')

      // Send actual message
      await messagingService.sendMessage({
        conversationId: `admin_patient_${currentPatientId}`,
        senderId: currentAdminId,
        recipientId: currentPatientId,
        content: newMessage,
        messageType: 'admin_response',
        priority: 'normal'
      })

      // Remove optimistic message and add real one
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.isOptimistic))
      setNewMessage(newMessage) // Restore message text
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={chatOptimizations.containerClass}>
      {/* Mobile Header */}
      <div className={chatOptimizations.headerClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mobileNavigation.useHamburgerMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className={`${touchOptimizations.buttonSize} p-2`}
              >
                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                </div>
              </Button>
            )}
            <div>
              <h2 className={`font-semibold ${touchOptimizations.fontSize}`}>
                {patientId ? `Patient ${patientId}` : 'Admin Chat'}
              </h2>
                             <p className="text-xs text-muted-foreground">
                 {isClient ? (mobileOptimization.isMobile ? 'Mobile' : mobileOptimization.isTablet ? 'Tablet' : 'Desktop') : 'Desktop'} • 
                 {isClient ? mobileOptimization.orientation : 'landscape'}
               </p>
            </div>
          </div>
                     <Badge variant="outline" className="text-xs">
             {isClient ? (mobileOptimization.touchEnabled ? 'Touch' : 'Mouse') : 'Mouse'}
           </Badge>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileNavigation.useHamburgerMenu && showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className={mobileClasses.sidebar}>
            <div className="p-4 border-b">
              <h3 className="font-semibold">Admin Tools</h3>
            </div>
            <div className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSidebar(false)}>
                📊 Patient Overview
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSidebar(false)}>
                💬 Message Templates
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSidebar(false)}>
                ⚠️ Safety Alerts
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSidebar(false)}>
                🎯 Progress Milestones
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {!mobileNavigation.collapseSidebar && (
          <div className={chatOptimizations.sidebarClass + " border-r bg-muted/30"}>
            <div className="p-4 border-b">
              <h3 className="font-semibold">Admin Tools</h3>
            </div>
            <div className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                📊 Patient Overview
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                💬 Message Templates
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                ⚠️ Safety Alerts
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                🎯 Progress Milestones
              </Button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${mobileClasses.content}`}>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-4xl mb-2">💬</div>
                                 <p className={touchOptimizations.fontSize}>
                   {isClient && mobileOptimization.isMobile 
                     ? "Start the conversation..." 
                     : "No messages yet. Send a message to get started."}
                 </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === (adminId || 'ADMIN-001') ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`${chatOptimizations.messageClass} ${
                      message.senderId === (adminId || 'ADMIN-001')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${message.isOptimistic ? 'opacity-70' : ''}`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={`text-xs mt-1 opacity-70 ${touchOptimizations.fontSize}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                      {message.isOptimistic && ' • Sending...'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                                 placeholder={isClient && mobileOptimization.isMobile ? "Type message..." : "Type your message..."}
                className={chatOptimizations.inputClass}
                disabled={isSending}
                {...inputOptimizations}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className={`${touchOptimizations.buttonSize} px-4`}
              >
                {isSending ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <span className={touchOptimizations.fontSize}>Send</span>
                )}
              </Button>
            </div>
            
                         {/* Mobile-specific quick actions */}
             {isClient && mobileOptimization.isMobile && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setNewMessage("How are you feeling today?")}
                >
                  Check-in
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setNewMessage("Great progress! Keep up the excellent work!")}
                >
                  Encourage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setNewMessage("Please remember to log your daily measurements.")}
                >
                  Remind
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

             {/* Mobile Bottom Navigation */}
       {isClient && mobileNavigation.showBottomNav && (
        <div className={mobileClasses.navigation + " bg-background border-t"}>
          <div className="flex items-center justify-around py-2">
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
              <div className={touchOptimizations.iconSize + " text-center"}>💬</div>
              <span className="text-xs">Chat</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
              <div className={touchOptimizations.iconSize + " text-center"}>📊</div>
              <span className="text-xs">Stats</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
              <div className={touchOptimizations.iconSize + " text-center"}>⚠️</div>
              <span className="text-xs">Alerts</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
              <div className={touchOptimizations.iconSize + " text-center"}>🎯</div>
              <span className="text-xs">Goals</span>
            </Button>
          </div>
        </div>
      )}

             {/* Mobile Optimization Debug Info */}
       {process.env.NODE_ENV === 'development' && isClient && (
         <div className="fixed top-2 right-2 z-50">
           <Card className="p-2">
             <div className="text-xs space-y-1">
               <div>Screen: {mobileOptimization.screenSize}</div>
               <div>Device: {mobileOptimization.isMobile ? 'Mobile' : mobileOptimization.isTablet ? 'Tablet' : 'Desktop'}</div>
               <div>Touch: {mobileOptimization.touchEnabled ? 'Yes' : 'No'}</div>
               <div>Orientation: {mobileOptimization.orientation}</div>
             </div>
           </Card>
         </div>
       )}
    </div>
  )
}
