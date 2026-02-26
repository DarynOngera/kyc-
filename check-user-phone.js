#!/usr/bin/env node
// Check user phone numbers in database

require('dotenv').config();
const db = require('./api/utils/db');

async function checkUsers() {
    console.log('🔍 Checking user phone numbers...\n');
    
    // Get all users
    let users;
    try {
        const result = await db.query(
            'SELECT id, email, full_name, phone_number FROM users ORDER BY created_at DESC LIMIT 10'
        );
        users = result.rows;
    } catch (error) {
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
    let matchingUser = null;
    try {
        const result = await db.query(
            'SELECT * FROM users WHERE phone_number = $1 LIMIT 1',
            [targetPhone]
        );
        matchingUser = result.rows[0] || null;
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
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
