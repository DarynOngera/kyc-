// Test function to check if environment variables are configured
const axios = require('axios');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    // Check which environment variables are set (without exposing values)
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    const envCheck = {
        MPESA_CONSUMER_KEY: !!consumerKey,
        MPESA_CONSUMER_SECRET: !!consumerSecret,
        MPESA_SHORTCODE: !!process.env.MPESA_SHORTCODE,
        MPESA_PASSKEY: !!process.env.MPESA_PASSKEY,
        MPESA_CALLBACK_URL: !!process.env.MPESA_CALLBACK_URL
    };
    
    const allConfigured = Object.values(envCheck).every(v => v === true);
    
    // Additional credential info (without exposing full values)
    const credentialInfo = {
        consumerKeyLength: consumerKey?.length || 0,
        consumerSecretLength: consumerSecret?.length || 0,
        consumerKeyFirst5: consumerKey?.substring(0, 5) || 'N/A',
        consumerKeyLast5: consumerKey?.substring(consumerKey?.length - 5) || 'N/A',
        hasWhitespace: {
            key: consumerKey?.trim().length !== consumerKey?.length,
            secret: consumerSecret?.trim().length !== consumerSecret?.length
        }
    };
    
    // Try to get access token
    let tokenTest = { success: false, error: null };
    if (consumerKey && consumerSecret) {
        try {
            const auth = Buffer.from(`${consumerKey.trim()}:${consumerSecret.trim()}`).toString('base64');
            const response = await axios.get(
                'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
                {
                    headers: { 'Authorization': `Basic ${auth}` }
                }
            );
            tokenTest.success = true;
            tokenTest.message = 'Successfully obtained access token';
        } catch (error) {
            tokenTest.success = false;
            tokenTest.error = error.response?.data || error.message;
            tokenTest.status = error.response?.status;
        }
    }
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            status: allConfigured ? 'OK' : 'INCOMPLETE',
            message: allConfigured 
                ? 'All M-Pesa environment variables are configured' 
                : 'Some M-Pesa environment variables are missing',
            environment: envCheck,
            credentialInfo,
            tokenTest,
            instructions: tokenTest.success 
                ? '✅ Credentials are valid! Payment function should work.'
                : '❌ Credentials are invalid or have issues. Check the tokenTest.error for details.'
        }, null, 2)
    };
};
