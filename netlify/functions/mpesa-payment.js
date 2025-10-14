// Netlify Function for M-Pesa Payment
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
    
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: { 'Authorization': `Basic ${auth}` }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Token error:', error.response?.data || error.message);
        throw new Error('Failed to get access token');
    }
}

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Parse request body
        const { phoneNumber, amount, accountReference } = JSON.parse(event.body);
        
        // Validate input
        if (!phoneNumber || !amount) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Phone number and amount are required' })
            };
        }
        
        console.log('Processing payment:', { phoneNumber, amount });
        
        // Get M-Pesa access token
        const token = await getAccessToken();
        
        // Generate timestamp and password
        const timestamp = generateTimestamp();
        const password = generatePassword(
            process.env.MPESA_SHORTCODE,
            process.env.MPESA_PASSKEY,
            timestamp
        );
        
        // Prepare M-Pesa request
        const requestBody = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.round(amount),
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://your-site.netlify.app/.netlify/functions/mpesa-callback',
            AccountReference: accountReference || 'KejaYaCapo',
            TransactionDesc: 'Payment for KejaYaCapo Order'
        };
        
        // Call M-Pesa API
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
        
        console.log('M-Pesa response:', response.data);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data)
        };
        
    } catch (error) {
        console.error('Payment error:', error.response?.data || error.message);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Payment failed',
                message: error.response?.data?.errorMessage || error.message
            })
        };
    }
};
