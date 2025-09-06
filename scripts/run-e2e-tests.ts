#!/usr/bin/env tsx

/**
 * Command Line E2E Testing Script
 * 
 * Run comprehensive end-to-end tests for Results Pro platform
 * Usage: npx tsx scripts/run-e2e-tests.ts [--suite=messaging|realtime|mobile|integration|performance|security]
 */

import { e2eTestingSuite } from '../lib/e2e-testing-suite'

async function main() {
  console.log('🚀 Results Pro E2E Testing Suite')
  console.log('='.repeat(50))

  const args = process.argv.slice(2)
  const suiteArg = args.find(arg => arg.startsWith('--suite='))
  const specificSuite = suiteArg ? suiteArg.split('=')[1] : null

  try {
    // Initialize the testing suite
    await e2eTestingSuite.initialize()

    // Run tests based on arguments
    if (specificSuite) {
      console.log(`\n🎯 Running specific test suite: ${specificSuite}\n`)
      // This would run a specific suite - for now we run all
      await e2eTestingSuite.runAllTests()
    } else {
      console.log('\n🧪 Running complete E2E test suite...\n')
      await e2eTestingSuite.runAllTests()
    }

    console.log('\n✅ E2E testing completed successfully!')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ E2E testing failed:', error)
    process.exit(1)
  } finally {
    // Cleanup test data
    await e2eTestingSuite.cleanup()
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Test execution interrupted by user')
  await e2eTestingSuite.cleanup()
  process.exit(1)
})

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Test execution terminated')
  await e2eTestingSuite.cleanup()
  process.exit(1)
})

// Run the main function
if (require.main === module) {
  main()
}

export { main }
