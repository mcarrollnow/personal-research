#!/usr/bin/env node

/**
 * Simple Direct Test for Messaging System
 */

require('dotenv').config({ path: '.env.local' });

async function runSimpleTest() {
  console.log('🧪 Simple Messaging System Test\n');
  console.log('================================');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded');
  
  try {
    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    console.log('✅ Supabase client created');
    
    // Test 1: Create test admin user
    console.log('\n📝 Test 1: Creating admin user...');
    
    const testAdmin = {
      admin_id: 'test_admin_simple',
      name: 'Simple Test Admin',
      email: 'test@example.com',
      role: 'coordinator',
      department: 'Testing',
      timezone: 'UTC',
      permissions: ['view_patients', 'send_messages'],
      active_status: true
    };
    
    // Clean up first
    await supabase.from('admin_users').delete().eq('admin_id', testAdmin.admin_id);
    
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert(testAdmin)
      .select()
      .single();
    
    if (adminError) throw adminError;
    
    console.log('✅ Admin user created:', adminData.name);
    
    // Test 2: Create conversation
    console.log('\n📝 Test 2: Creating conversation...');
    
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        patient_id: 'test_patient_simple',
        admin_id: testAdmin.admin_id,
        status: 'active'
      })
      .select()
      .single();
    
    if (conversationError) throw conversationError;
    
    console.log('✅ Conversation created:', conversationData.id);
    
    // Test 3: Send message
    console.log('\n📝 Test 3: Sending message...');
    
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationData.id,
        from_user_id: testAdmin.admin_id,
        to_user_id: 'test_patient_simple',
        content: 'This is a test message from the admin.',
        message_type: 'general',
        priority: 'normal',
        read_status: false,
        attachments: []
      })
      .select()
      .single();
    
    if (messageError) throw messageError;
    
    console.log('✅ Message sent:', messageData.content.substring(0, 30) + '...');
    
    // Test 4: Retrieve messages
    console.log('\n📝 Test 4: Retrieving messages...');
    
    const { data: messagesData, error: messagesError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationData.id)
      .order('created_at', { ascending: false });
    
    if (messagesError) throw messagesError;
    
    console.log('✅ Messages retrieved:', count, 'message(s)');
    
    // Test 5: Create message template
    console.log('\n📝 Test 5: Creating message template...');
    
    const { data: templateData, error: templateError } = await supabase
      .from('message_templates')
      .insert({
        admin_id: testAdmin.admin_id,
        title: 'Simple Test Template',
        content: 'Hello {{patientName}}, this is a test template.',
        category: 'Testing',
        is_global: false,
        usage_count: 0
      })
      .select()
      .single();
    
    if (templateError) throw templateError;
    
    console.log('✅ Template created:', templateData.title);
    
    // Test 6: Update conversation
    console.log('\n📝 Test 6: Updating conversation...');
    
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_count: 1
      })
      .eq('id', conversationData.id);
    
    if (updateError) throw updateError;
    
    console.log('✅ Conversation updated');
    
    // Test 7: Mark message as read
    console.log('\n📝 Test 7: Marking message as read...');
    
    const { error: readError } = await supabase
      .from('messages')
      .update({ read_status: true })
      .eq('id', messageData.id);
    
    if (readError) throw readError;
    
    console.log('✅ Message marked as read');
    
    // Test 8: Get admin stats
    console.log('\n📝 Test 8: Getting admin statistics...');
    
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', testAdmin.admin_id);
    
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', testAdmin.admin_id);
    
    console.log('✅ Admin stats retrieved:');
    console.log('   - Conversations:', totalConversations || 0);
    console.log('   - Messages sent:', totalMessages || 0);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    await supabase.from('messages').delete().eq('conversation_id', conversationData.id);
    await supabase.from('conversations').delete().eq('id', conversationData.id);
    await supabase.from('message_templates').delete().eq('admin_id', testAdmin.admin_id);
    await supabase.from('admin_users').delete().eq('admin_id', testAdmin.admin_id);
    
    console.log('✅ Cleanup completed');
    
    // Success summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('✅ Supabase connection working');
    console.log('✅ Admin user management working');
    console.log('✅ Conversation management working');
    console.log('✅ Message sending/receiving working');
    console.log('✅ Message templates working');
    console.log('✅ Database operations working');
    console.log('✅ Data cleanup working');
    
    console.log('\n🚀 Your messaging system is ready for Chunk 2!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Try cleanup on error
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('messages').delete().like('from_user_id', 'test_%');
      await supabase.from('conversations').delete().like('patient_id', 'test_%');
      await supabase.from('message_templates').delete().like('admin_id', 'test_%');
      await supabase.from('admin_users').delete().like('admin_id', 'test_%');
      
      console.log('🧹 Emergency cleanup completed');
    } catch (cleanupError) {
      console.log('⚠️  Could not clean up test data:', cleanupError.message);
    }
    
    return false;
  }
}

// Run the test
runSimpleTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
