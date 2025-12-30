#!/usr/bin/env node
// Comprehensive STK Push Diagnostic Tool

require('dotenv').config();
const axios = require('axios');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function getMpesaBaseURL() {
    const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    return environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
}

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
    const baseURL = getMpesaBaseURL();
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await axios.get(
        `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
        {
            headers: { 'Authorization': `Basic ${auth}` }
        }
    );
    
    return response.data.access_token;
}

async function testSTKPush() {
    log('\n🧪 M-Pesa STK Push Comprehensive Diagnostic', 'bright');
    log('='.repeat(60), 'cyan');
    log('');
    
    // Step 1: Check Environment Variables
    log('📋 Step 1: Checking Environment Variables', 'blue');
    log('-'.repeat(60));
    
    const config = {
        environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        shortcode: process.env.MPESA_SHORTCODE,
        passkey: process.env.MPESA_PASSKEY,
        callbackURL: process.env.MPESA_CALLBACK_URL
    };
    
    const checks = {
        'Environment': config.environment,
        'Consumer Key': config.consumerKey ? `✓ Set (${config.consumerKey.substring(0, 10)}...)` : '✗ NOT SET',
        'Consumer Secret': config.consumerSecret ? `✓ Set (${config.consumerSecret.substring(0, 10)}...)` : '✗ NOT SET',
        'Shortcode': config.shortcode || '✗ NOT SET',
        'Passkey': config.passkey ? `✓ Set (${config.passkey.length} chars)` : '✗ NOT SET',
        'Callback URL': config.callbackURL || '✗ NOT SET'
    };
    
    Object.entries(checks).forEach(([key, value]) => {
        const color = value.includes('✗') ? 'red' : 'green';
        log(`   ${key}: ${value}`, color);
    });
    
    if (!config.consumerKey || !config.consumerSecret || !config.shortcode || !config.passkey) {
        log('\n❌ Missing required environment variables!', 'red');
        log('Please check your .env file', 'yellow');
        process.exit(1);
    }
    
    log('');
    
    // Step 2: Check Callback URL Accessibility
    log('📡 Step 2: Testing Callback URL Accessibility', 'blue');
    log('-'.repeat(60));
    
    if (config.callbackURL) {
        try {
            log(`   Testing: ${config.callbackURL}`, 'cyan');
            const callbackTest = await axios.post(config.callbackURL, { test: true }, {
                timeout: 10000,
                validateStatus: () => true // Accept any status
            });
            
            if (callbackTest.status === 200) {
                log(`   ✓ Callback URL is accessible (Status: ${callbackTest.status})`, 'green');
            } else {
                log(`   ⚠ Callback returned status: ${callbackTest.status}`, 'yellow');
                log(`   This might prevent STK push from working`, 'yellow');
            }
        } catch (error) {
            log(`   ✗ Callback URL not accessible: ${error.message}`, 'red');
            log(`   ⚠ M-Pesa requires callback to be publicly accessible`, 'yellow');
            log(`   For local testing, use ngrok or deploy to your server`, 'yellow');
        }
    } else {
        log('   ✗ No callback URL configured', 'red');
    }
    
    log('');
    
    // Step 3: Test Access Token
    log('🔐 Step 3: Testing Access Token Generation', 'blue');
    log('-'.repeat(60));
    
    const baseURL = getMpesaBaseURL();
    log(`   Environment: ${config.environment.toUpperCase()}`, 'cyan');
    log(`   Base URL: ${baseURL}`, 'cyan');
    
    let token;
    try {
        token = await getAccessToken();
        log(`   ✓ Access token obtained successfully`, 'green');
        log(`   Token: ${token.substring(0, 20)}...`, 'cyan');
    } catch (error) {
        log(`   ✗ Failed to get access token`, 'red');
        log(`   Error: ${error.response?.data?.error_description || error.message}`, 'red');
        log('', '');
        log('Common causes:', 'yellow');
        log('   1. Invalid consumer key/secret', 'yellow');
        log('   2. Credentials are for different environment', 'yellow');
        log('   3. Credentials expired', 'yellow');
        process.exit(1);
    }
    
    log('');
    
    // Step 4: Test STK Push
    log('📱 Step 4: Sending Test STK Push', 'blue');
    log('-'.repeat(60));
    
    const phoneNumber = process.argv[2] || '254757238817';
    const amount = parseInt(process.argv[3]) || 1;
    
    log(`   Phone Number: ${phoneNumber}`, 'cyan');
    log(`   Amount: KES ${amount}`, 'cyan');
    log('');
    
    const timestamp = generateTimestamp();
    const password = generatePassword(config.shortcode, config.passkey, timestamp);
    
    const requestBody = {
        BusinessShortCode: parseInt(config.shortcode),
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: parseInt(phoneNumber),
        PartyB: parseInt(config.shortcode),
        PhoneNumber: parseInt(phoneNumber),
        CallBackURL: config.callbackURL || 'http://localhost:3000/api/mpesa/callback',
        AccountReference: 'TestPayment',
        TransactionDesc: 'Test STK Push'
    };
    
    log('   Sending STK Push request...', 'cyan');
    
    try {
        const response = await axios.post(
            `${baseURL}/mpesa/stkpush/v1/processrequest`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        log('');
        log('✅ STK Push Request Successful!', 'green');
        log('='.repeat(60), 'green');
        log('');
        log('Response:', 'bright');
        log(JSON.stringify(response.data, null, 2), 'cyan');
        log('');
        
        if (response.data.ResponseCode === '0') {
            log('✅ Request accepted by M-Pesa', 'green');
            log('');
            log('What happens next:', 'bright');
            log('   1. Check your phone for STK push prompt', 'yellow');
            log('   2. Enter your M-Pesa PIN', 'yellow');
            log('   3. M-Pesa will send callback to your server', 'yellow');
            log('   4. Check your server logs for callback', 'yellow');
            log('');
            log('Tracking Info:', 'bright');
            log(`   CheckoutRequestID: ${response.data.CheckoutRequestID}`, 'cyan');
            log(`   MerchantRequestID: ${response.data.MerchantRequestID}`, 'cyan');
            log('');
            
            if (config.environment === 'sandbox') {
                log('⚠️  SANDBOX LIMITATIONS:', 'yellow');
                log('   • STK prompts may not be sent reliably', 'yellow');
                log('   • Only whitelisted numbers receive prompts', 'yellow');
                log('   • For reliable testing, use production credentials', 'yellow');
            } else {
                log('🎉 PRODUCTION MODE:', 'green');
                log('   • Real STK prompt will be sent to phone', 'green');
                log('   • Real money will be deducted', 'green');
                log('   • Callback will be triggered on payment', 'green');
            }
        } else {
            log(`⚠️  Request returned code: ${response.data.ResponseCode}`, 'yellow');
            log(`   Description: ${response.data.ResponseDescription}`, 'yellow');
        }
        
    } catch (error) {
        log('');
        log('❌ STK Push Request Failed!', 'red');
        log('='.repeat(60), 'red');
        log('');
        
        if (error.response) {
            log('Error Response:', 'red');
            log(JSON.stringify(error.response.data, null, 2), 'red');
            log('');
            
            const errorMsg = error.response.data?.errorMessage || '';
            
            if (errorMsg.includes('Invalid Access Token')) {
                log('Cause: Invalid or expired access token', 'yellow');
                log('Solution: Check your consumer key/secret', 'yellow');
            } else if (errorMsg.includes('Bad Request')) {
                log('Cause: Invalid request parameters', 'yellow');
                log('Solution: Check shortcode, passkey, and phone number', 'yellow');
            } else if (errorMsg.includes('callback')) {
                log('Cause: Callback URL validation failed', 'yellow');
                log('Solution: Ensure callback URL is publicly accessible', 'yellow');
            }
        } else {
            log(`Error: ${error.message}`, 'red');
        }
    }
    
    log('');
    log('='.repeat(60), 'cyan');
    log('Test Complete', 'bright');
    log('');
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    log('\nUsage: node test-stk-push.js [phone_number] [amount]', 'bright');
    log('');
    log('Examples:', 'cyan');
    log('  node test-stk-push.js                    # Uses default: 254757238817, KES 1');
    log('  node test-stk-push.js 254712345678       # Custom phone, KES 1');
    log('  node test-stk-push.js 254712345678 10    # Custom phone, KES 10');
    log('');
    process.exit(0);
}

testSTKPush().catch(error => {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    process.exit(1);
});
