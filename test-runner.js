#!/usr/bin/env node

/**
 * Simple Test Runner for Messaging System
 * 
 * Run with: node test-runner.js
 * Or: npm run test-messaging (if added to package.json)
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Messaging System Test Runner')
console.log('================================')

// Check if we're in a Node.js environment
if (typeof window !== 'undefined') {
  console.error('❌ This test runner should be executed in Node.js, not in a browser')
  process.exit(1)
}

// Environment check
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

console.log('🔍 Checking environment variables...')
const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`   - ${varName}`))
  console.error('\nPlease set these variables in your .env.local file')
  process.exit(1)
}

console.log('✅ Environment variables check passed')

// Import and run tests
async function runTests() {
  try {
    console.log('\n🚀 Importing test modules...')
    
    // Dynamic import for ES modules
    const { runAllTests, runQuickTest, individualTests } = await import('./lib/test-messaging-system.js')
    
    const testType = process.argv[2] || 'full'
    
    switch (testType) {
      case 'quick':
        console.log('🏃‍♂️ Running quick tests only...\n')
        await runQuickTest()
        break
        
      case 'connection':
        console.log('🔌 Testing Supabase connection only...\n')
        await individualTests.testSupabaseConnection()
        break
        
      case 'admin':
        console.log('👤 Testing admin functionality only...\n')
        await individualTests.testCreateAdminUser()
        await individualTests.testGetAdminUser()
        await individualTests.cleanup()
        break
        
      case 'templates':
        console.log('📋 Testing template functionality only...\n')
        await individualTests.testCreateAdminUser()
        await individualTests.testCreateDefaultTemplates()
        await individualTests.testGetTemplates()
        await individualTests.cleanup()
        break
        
      case 'messaging':
        console.log('💬 Testing messaging functionality only...\n')
        await individualTests.testCreateAdminUser()
        await individualTests.testCreateConversation()
        await individualTests.testSendMessage()
        await individualTests.cleanup()
        break
        
      default:
        console.log('🔄 Running full test suite...\n')
        const results = await runAllTests()
        
        if (results.successRate === 100) {
          console.log('\n🎉 All tests passed! The messaging system is ready.')
          process.exit(0)
        } else {
          console.log(`\n⚠️  Some tests failed. Success rate: ${results.successRate.toFixed(1)}%`)
          process.exit(1)
        }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message)
    console.error('\nPossible causes:')
    console.error('- Supabase connection issues')
    console.error('- Missing database tables')
    console.error('- Environment variables not set correctly')
    console.error('- Network connectivity issues')
    
    if (error.stack) {
      console.error('\nFull error stack:')
      console.error(error.stack)
    }
    
    process.exit(1)
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 Usage:')
  console.log('  node test-runner.js [test-type]')
  console.log('\nTest Types:')
  console.log('  full       - Run all tests (default)')
  console.log('  quick      - Run basic connectivity and setup tests')
  console.log('  connection - Test Supabase connection only')
  console.log('  admin      - Test admin user functionality')
  console.log('  templates  - Test template functionality')
  console.log('  messaging  - Test core messaging functionality')
  console.log('\nExamples:')
  console.log('  node test-runner.js')
  console.log('  node test-runner.js quick')
  console.log('  node test-runner.js connection')
  process.exit(0)
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
