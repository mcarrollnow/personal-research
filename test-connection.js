#!/usr/bin/env node

/**
 * Simple Supabase Connection Test
 */

require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('URL present:', !!supabaseUrl);
    console.log('Key present:', !!supabaseKey);
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 API Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    console.log('\n🚀 Creating Supabase client...');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    
    console.log('✅ Supabase client created');
    
    // Test basic connection
    console.log('\n🔌 Testing database connection...');
    
    const { data, error, count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation "admin_users" does not exist')) {
        console.log('⚠️  admin_users table does not exist yet');
        console.log('💡 This is expected if you haven\'t run the Supabase setup SQL yet');
        console.log('\n📋 Next steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Open the SQL Editor');
        console.log('3. Run the SQL commands from SUPABASE_SETUP_GUIDE.md');
        return false;
      } else {
        throw error;
      }
    }
    
    console.log('✅ Database connection successful');
    console.log(`📊 admin_users table exists (${count || 0} records)`);
    
    // Test other tables
    const tables = ['messages', 'conversations', 'message_templates'];
    
    for (const table of tables) {
      try {
        const { error: tableError, count: tableCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (tableError) {
          console.log(`⚠️  ${table} table: ${tableError.message}`);
        } else {
          console.log(`✅ ${table} table exists (${tableCount || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table} table: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 This might be a network connectivity issue');
      console.log('- Check your internet connection');
      console.log('- Verify the Supabase URL is correct');
      console.log('- Make sure your Supabase project is running');
    }
    
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Ready to run full messaging system tests!');
      console.log('   Run: node test-runner.js');
      process.exit(0);
    } else {
      console.log('\n⚠️  Please set up your Supabase tables before running full tests');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
