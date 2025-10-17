#!/usr/bin/env node
// Check user phone numbers in database

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('🔍 Checking user phone numbers...\n');
    
    // Get all users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone_number')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('❌ Error:', error);
        return;
    }
    
    if (!users || users.length === 0) {
        console.log('⚠️  No users found in database');
        return;
    }
    
    console.log(`Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || 'No name'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone_number || 'NOT SET'}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
    });
    
    // Check for the specific phone number
    const targetPhone = '254757238817';
    const { data: matchingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', targetPhone)
        .single();
    
    console.log(`\n🔎 Looking for phone: ${targetPhone}`);
    if (matchingUser) {
        console.log('✅ Found matching user:', matchingUser.full_name);
    } else {
        console.log('❌ No user found with this phone number');
        console.log('\n💡 To fix this, update the user record:');
        console.log(`   UPDATE users SET phone_number = '${targetPhone}' WHERE email = 'your-email@example.com';`);
    }
}

checkUsers().catch(console.error);
