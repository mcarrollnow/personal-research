/**
 * Comprehensive Test Suite for Messaging System
 * 
 * This file tests all the core functionality of the Supabase messaging system
 * to ensure everything works correctly before moving to Chunk 2.
 */

import { messagingIntegration } from './messaging-integration'
import { adminService } from './admin-service'
import { templateService } from './template-service'
import { messagingService } from './messaging-service'
import { supabase } from './supabase'

// Test configuration
const TEST_CONFIG = {
  adminId: 'test_admin_001',
  patientId: 'test_patient_001',
  adminData: {
    admin_id: 'test_admin_001',
    name: 'Test Admin',
    email: 'test.admin@example.com',
    role: 'coordinator' as const,
    department: 'Testing',
    timezone: 'UTC',
    permissions: ['view_patients', 'send_messages', 'manage_templates']
  }
}

// Test results tracking
interface TestResult {
  testName: string
  passed: boolean
  error?: string
  data?: any
}

const testResults: TestResult[] = []

function logTest(testName: string, passed: boolean, error?: string, data?: any) {
  testResults.push({ testName, passed, error, data })
  const status = passed ? '✅' : '❌'
  console.log(`${status} ${testName}`)
  if (error) console.log(`   Error: ${error}`)
  if (data) console.log(`   Data:`, data)
}

// Test 1: Supabase Connection
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('admin_users').select('count', { count: 'exact', head: true })
    
    if (error) throw error
    
    logTest('Supabase Connection', true, undefined, { count: data })
    return true
  } catch (error) {
    logTest('Supabase Connection', false, error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

// Test 2: Admin Service - Create Admin User
async function testCreateAdminUser() {
  try {
    // Clean up any existing test admin first
    await supabase.from('admin_users').delete().eq('admin_id', TEST_CONFIG.adminId)
    
    const result = await adminService.createAdminUser(TEST_CONFIG.adminData)
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create admin user')
    }
    
    logTest('Create Admin User', true, undefined, { 
      name: result.data.name, 
      role: result.data.role 
    })
    return result.data
  } catch (error) {
    logTest('Create Admin User', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 3: Admin Service - Get Admin User
async function testGetAdminUser() {
  try {
    const result = await adminService.getAdminUser(TEST_CONFIG.adminId)
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get admin user')
    }
    
    logTest('Get Admin User', true, undefined, { 
      name: result.data.name,
      email: result.data.email 
    })
    return result.data
  } catch (error) {
    logTest('Get Admin User', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 4: Template Service - Create Default Templates
async function testCreateDefaultTemplates() {
  try {
    const result = await templateService.createDefaultTemplates(TEST_CONFIG.adminId)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create default templates')
    }
    
    logTest('Create Default Templates', true, undefined, { 
      message: result.message 
    })
    return true
  } catch (error) {
    logTest('Create Default Templates', false, error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

// Test 5: Template Service - Get Templates
async function testGetTemplates() {
  try {
    const result = await templateService.getTemplates(TEST_CONFIG.adminId, undefined, true)
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get templates')
    }
    
    logTest('Get Templates', true, undefined, { 
      count: result.data.total,
      categories: [...new Set(result.data.data.map(t => t.category))]
    })
    return result.data.data
  } catch (error) {
    logTest('Get Templates', false, error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Test 6: Messaging Service - Create Conversation
async function testCreateConversation() {
  try {
    const result = await messagingService.createConversation(
      TEST_CONFIG.patientId,
      TEST_CONFIG.adminId
    )
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create conversation')
    }
    
    logTest('Create Conversation', true, undefined, { 
      conversationId: result.data.id,
      patientId: result.data.patient_id,
      adminId: result.data.admin_id
    })
    return result.data
  } catch (error) {
    logTest('Create Conversation', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 7: Messaging Service - Send Message
async function testSendMessage(conversationId: string) {
  try {
    const result = await messagingService.sendMessage(
      conversationId,
      TEST_CONFIG.adminId,
      TEST_CONFIG.patientId,
      'This is a test message from the admin to the patient.',
      'general',
      'normal'
    )
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to send message')
    }
    
    logTest('Send Message', true, undefined, { 
      messageId: result.data.id,
      content: result.data.content.substring(0, 30) + '...',
      messageType: result.data.message_type
    })
    return result.data
  } catch (error) {
    logTest('Send Message', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 8: Messaging Service - Get Messages
async function testGetMessages(conversationId: string) {
  try {
    const result = await messagingService.getMessages(conversationId, 1, 10)
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get messages')
    }
    
    logTest('Get Messages', true, undefined, { 
      messageCount: result.data.data.length,
      total: result.data.total
    })
    return result.data.data
  } catch (error) {
    logTest('Get Messages', false, error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

// Test 9: Integration Service - Send Message with Template
async function testSendMessageWithTemplate(conversationId: string, templates: any[]) {
  try {
    const welcomeTemplate = templates.find(t => t.title.includes('Welcome'))
    if (!welcomeTemplate) {
      throw new Error('Welcome template not found')
    }
    
    const result = await messagingIntegration.sendMessageWithTemplate(
      conversationId,
      TEST_CONFIG.adminId,
      TEST_CONFIG.patientId,
      welcomeTemplate.id,
      { patientName: 'Test Patient' }
    )
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to send templated message')
    }
    
    logTest('Send Message with Template', true, undefined, { 
      templateTitle: welcomeTemplate.title,
      messageContent: result.data.content.substring(0, 50) + '...'
    })
    return result.data
  } catch (error) {
    logTest('Send Message with Template', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 10: Integration Service - Initialize Admin Messaging
async function testInitializeAdminMessaging() {
  try {
    const result = await messagingIntegration.initializeAdminMessaging(TEST_CONFIG.adminId)
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to initialize admin messaging')
    }
    
    logTest('Initialize Admin Messaging', true, undefined, { 
      adminName: result.data.admin.name,
      conversationCount: result.data.conversations.length,
      templateCategories: result.data.templates.length,
      unreadMessages: result.data.stats?.unreadMessages || 0
    })
    return result.data
  } catch (error) {
    logTest('Initialize Admin Messaging', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 11: Admin Service - Get Admin Stats
async function testGetAdminStats() {
  try {
    const result = await adminService.getAdminStats(TEST_CONFIG.adminId)
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get admin stats')
    }
    
    logTest('Get Admin Stats', true, undefined, result.data)
    return result.data
  } catch (error) {
    logTest('Get Admin Stats', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 12: Messaging Service - Mark Messages as Read
async function testMarkMessagesAsRead(conversationId: string) {
  try {
    const result = await messagingService.markMessagesAsRead(conversationId, TEST_CONFIG.patientId)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to mark messages as read')
    }
    
    logTest('Mark Messages as Read', true, undefined, { message: result.message })
    return true
  } catch (error) {
    logTest('Mark Messages as Read', false, error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

// Test 13: Template Service - Create Custom Template
async function testCreateCustomTemplate() {
  try {
    const result = await templateService.createTemplate({
      admin_id: TEST_CONFIG.adminId,
      title: 'Test Custom Template',
      content: 'This is a custom test template for {{patientName}}.',
      category: 'Testing',
      is_global: false
    })
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create custom template')
    }
    
    logTest('Create Custom Template', true, undefined, { 
      templateId: result.data.id,
      title: result.data.title
    })
    return result.data
  } catch (error) {
    logTest('Create Custom Template', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Test 14: Integration Service - Broadcast Message
async function testBroadcastMessage() {
  try {
    const result = await messagingIntegration.broadcastMessage(
      TEST_CONFIG.adminId,
      [TEST_CONFIG.patientId, 'test_patient_002'],
      'This is a test broadcast message to multiple patients.',
      'general',
      'normal'
    )
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to broadcast message')
    }
    
    logTest('Broadcast Message', true, undefined, { 
      sent: result.data.sent,
      failed: result.data.failed
    })
    return result.data
  } catch (error) {
    logTest('Broadcast Message', false, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Cleanup function
async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up test data...')
    
    // Delete test messages and conversations
    await supabase.from('messages').delete().or(`from_user_id.eq.${TEST_CONFIG.adminId},to_user_id.eq.${TEST_CONFIG.adminId}`)
    await supabase.from('conversations').delete().or(`patient_id.eq.${TEST_CONFIG.patientId},admin_id.eq.${TEST_CONFIG.adminId}`)
    
    // Delete test templates
    await supabase.from('message_templates').delete().eq('admin_id', TEST_CONFIG.adminId)
    
    // Delete test admin user
    await supabase.from('admin_users').delete().eq('admin_id', TEST_CONFIG.adminId)
    
    console.log('✅ Cleanup completed')
  } catch (error) {
    console.log('⚠️  Cleanup error:', error)
  }
}

// Main test runner
export async function runAllTests() {
  console.log('🧪 Starting Comprehensive Messaging System Tests\n')
  console.log('=' .repeat(60))
  
  let conversation: any = null
  let templates: any[] = []
  
  try {
    // Run tests in sequence
    await testSupabaseConnection()
    await testCreateAdminUser()
    await testGetAdminUser()
    await testCreateDefaultTemplates()
    
    templates = await testGetTemplates()
    conversation = await testCreateConversation()
    
    if (conversation) {
      await testSendMessage(conversation.id)
      await testGetMessages(conversation.id)
      
      if (templates.length > 0) {
        await testSendMessageWithTemplate(conversation.id, templates)
      }
      
      await testMarkMessagesAsRead(conversation.id)
    }
    
    await testInitializeAdminMessaging()
    await testGetAdminStats()
    await testCreateCustomTemplate()
    await testBroadcastMessage()
    
  } catch (error) {
    console.error('❌ Test suite error:', error)
  }
  
  // Print results summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(60))
  
  const passed = testResults.filter(t => t.passed).length
  const failed = testResults.filter(t => !t.passed).length
  const total = testResults.length
  
  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    testResults
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.testName}: ${t.error}`))
  }
  
  // Cleanup
  await cleanup()
  
  console.log('\n🎉 Test suite completed!')
  
  return {
    total,
    passed,
    failed,
    successRate: (passed / total) * 100,
    results: testResults
  }
}

// Individual test functions for targeted testing
export const individualTests = {
  testSupabaseConnection,
  testCreateAdminUser,
  testGetAdminUser,
  testCreateDefaultTemplates,
  testGetTemplates,
  testCreateConversation,
  testSendMessage,
  testGetMessages,
  testSendMessageWithTemplate,
  testInitializeAdminMessaging,
  testGetAdminStats,
  testMarkMessagesAsRead,
  testCreateCustomTemplate,
  testBroadcastMessage,
  cleanup
}

// Quick test function for basic functionality
export async function runQuickTest() {
  console.log('🚀 Running Quick Test...\n')
  
  const quickTests = [
    testSupabaseConnection,
    testCreateAdminUser,
    testCreateDefaultTemplates,
    testGetTemplates
  ]
  
  for (const test of quickTests) {
    await test()
  }
  
  await cleanup()
  
  const passed = testResults.filter(t => t.passed).length
  const total = testResults.length
  
  console.log(`\n✅ Quick test completed: ${passed}/${total} tests passed`)
  
  return passed === total
}
