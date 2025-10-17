#!/usr/bin/env node
// Diagnostic script to test M-Pesa STK Push directly

require('dotenv').config();
const axios = require('axios');

// Helper functions
function generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generatePassword(shortCode, passkey, timestamp) {
    const str = shortCode + passkey + timestamp;
    return Buffer.from(str).toString('base64');
}

async function getAccessToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
            headers: { 'Authorization': `Basic ${auth}` }
        }
    );
    
    return response.data.access_token;
}

async function testSTKPush() {
    console.log('🔍 M-Pesa STK Push Diagnostic Tool\n');
    console.log('================================\n');
    
    // Check environment variables
    console.log('📋 Configuration Check:');
    console.log('   Shortcode:', process.env.MPESA_SHORTCODE);
    console.log('   Passkey length:', process.env.MPESA_PASSKEY?.length);
    console.log('   Consumer Key length:', process.env.MPESA_CONSUMER_KEY?.length);
    console.log('   Consumer Secret length:', process.env.MPESA_CONSUMER_SECRET?.length);
    console.log('   Callback URL:', process.env.MPESA_CALLBACK_URL);
    console.log('');
    
    try {
        // Get token
        console.log('🔐 Getting access token...');
        const token = await getAccessToken();
        console.log('   ✅ Token obtained\n');
        
        // Prepare request
        const timestamp = generateTimestamp();
        const password = generatePassword(
            process.env.MPESA_SHORTCODE,
            process.env.MPESA_PASSKEY,
            timestamp
        );
        
        const phoneNumber = '254757238817'; // Safaricom test number
        const amount = 1; // Minimum amount for testing
        
        const requestBody = {
            BusinessShortCode: parseInt(process.env.MPESA_SHORTCODE),
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: parseInt(phoneNumber),
            PartyB: parseInt(process.env.MPESA_SHORTCODE),
            PhoneNumber: parseInt(phoneNumber),
            CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://mydomain.com/callback',
            AccountReference: 'TestPayment',
            TransactionDesc: 'Test STK Push'
        };
        
        console.log('📤 Sending STK Push request...');
        console.log('   Phone:', phoneNumber);
        console.log('   Amount:', amount);
        console.log('');
        
        // Send request
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('📥 M-Pesa Response:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');
        
        // Analyze response
        if (response.data.ResponseCode === '0') {
            console.log('✅ Request accepted by M-Pesa');
            console.log('');
            console.log('⚠️  IMPORTANT NOTES:');
            console.log('   1. Sandbox often doesn\'t send actual STK prompts');
            console.log('   2. Even with ResponseCode "0", the prompt may not appear');
            console.log('   3. This is a known limitation of the sandbox environment');
            console.log('   4. Production credentials will send real prompts');
            console.log('');
            console.log('💡 RECOMMENDATIONS:');
            console.log('   • For development: Use callback simulation');
            console.log('   • For testing: Apply for production credentials');
            console.log('   • Check Daraja portal for any app restrictions');
        } else {
            console.log('❌ Request failed');
            console.log('   Code:', response.data.ResponseCode);
            console.log('   Description:', response.data.ResponseDescription);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 400) {
            console.log('\n⚠️  Possible issues:');
            console.log('   • Invalid credentials');
            console.log('   • Wrong shortcode/passkey combination');
            console.log('   • Expired sandbox app');
        }
    }
}

testSTKPush();
