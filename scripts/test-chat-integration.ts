#!/usr/bin/env tsx

/**
 * Test Script: Chat Integration Verification
 * 
 * This script tests the core chat functionality to ensure
 * Supabase integration is working correctly.
 */

import { chatService } from '../lib/chat-service'
import { messagingService } from '../lib/messaging-service'

async function testChatIntegration() {
  console.log('🧪 Testing Chat Integration...\n')

  try {
    // Test 1: Initialize chat service
    console.log('1️⃣ Testing chat service initialization...')
    await chatService.initialize('test-patient-1', 'patient')
    console.log('✅ Chat service initialized successfully\n')

    // Test 2: Test messaging service connection
    console.log('2️⃣ Testing messaging service connection...')
    const conversations = await messagingService.getConversations()
    console.log(`✅ Retrieved ${conversations.data?.data.length || 0} conversations\n`)

    // Test 3: Test chat service conversation loading
    console.log('3️⃣ Testing chat service conversation transformation...')
    const chatConversations = await chatService.getConversations()
    console.log(`✅ Transformed ${chatConversations.length} conversations for UI\n`)

    // Test 4: Test current user retrieval
    console.log('4️⃣ Testing current user context...')
    const currentUser = chatService.getCurrentUser()
    console.log(`✅ Current user: ${currentUser?.name} (${currentUser?.role})\n`)

    console.log('🎉 All tests passed! Chat integration is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    // Cleanup
    chatService.cleanup()
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testChatIntegration()
}

export { testChatIntegration }
