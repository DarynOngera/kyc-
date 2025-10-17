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
    
    // Validate credentials exist
    if (!consumerKey || !consumerSecret) {
        throw new Error('M-Pesa credentials not configured');
    }
    
    // Trim whitespace (common issue when copying from Netlify UI)
    const cleanKey = consumerKey.trim();
    const cleanSecret = consumerSecret.trim();
    
    // Check for common issues
    if (cleanKey.includes(' ') || cleanSecret.includes(' ')) {
        throw new Error('M-Pesa credentials contain spaces - please check your environment variables');
    }
    
    const auth = Buffer.from(`${cleanKey}:${cleanSecret}`).toString('base64');
    
    console.log('Attempting token request with key length:', cleanKey.length, 'secret length:', cleanSecret.length);
    
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: { 'Authorization': `Basic ${auth}` }
            }
        );
        console.log('Token obtained successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('Token error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            consumerKeyLength: cleanKey?.length,
            consumerSecretLength: cleanSecret?.length,
            keyFirstChars: cleanKey?.substring(0, 5),
            keyLastChars: cleanKey?.substring(cleanKey.length - 5)
        });
        
        if (error.response?.status === 400) {
            throw new Error('Invalid M-Pesa credentials. Please verify your MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are correct for the sandbox environment.');
        }
        
        throw new Error(`Failed to get access token: ${error.response?.data?.error_description || error.message}`);
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
    
    // Check if environment variables are set
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
        console.error('Missing M-Pesa credentials in environment variables');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Server configuration error',
                message: 'M-Pesa credentials not configured. Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in Netlify environment variables.'
            })
        };
    }

    // Parse request body with error handling
    let phoneNumber, amount, accountReference;
    try {
        const requestData = JSON.parse(event.body || '{}');
        ({ phoneNumber, amount, accountReference } = requestData);
    } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid request body', message: parseError.message })
        };
    }

    // Extract user ID from JWT token (optional, for linking transaction to user)
    let userId = null;
    try {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded?.userId;
            console.log('User ID from token:', userId);
        }
    } catch (authError) {
        console.log('No valid auth token, proceeding without user ID');
    }

    // Validate input
    if (!phoneNumber || !amount) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Phone number and amount are required' })
        };
    }

    console.log('Processing payment:', { phoneNumber, amount });

    // Main function logic
    try {
        // Get M-Pesa access token
        const token = await getAccessToken();
        
        // Generate timestamp and password
        const timestamp = generateTimestamp();
        const password = generatePassword(
            process.env.MPESA_SHORTCODE,
            process.env.MPESA_PASSKEY,
            timestamp
        );
        
        // Prepare M-Pesa request (matching exact format from Daraja docs)
        const requestBody = {
            BusinessShortCode: parseInt(process.env.MPESA_SHORTCODE),
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.round(amount),
            PartyA: parseInt(phoneNumber),
            PartyB: parseInt(process.env.MPESA_SHORTCODE),
            PhoneNumber: parseInt(phoneNumber),
            CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://kejayacapo.netlify.app/.netlify/functions/mpesa-callback',
            AccountReference: accountReference || 'KejaYaCapo',
            TransactionDesc: 'Payment for KejaYaCapo Order'
        };
        
        console.log('Request body prepared:', JSON.stringify(requestBody, null, 2));
        
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
        
        // Store initial transaction record with CheckoutRequestID for tracking
        if (response.data.CheckoutRequestID) {
            try {
                const { getSupabaseClient } = require('./utils/supabase');
                const supabase = getSupabaseClient();
                
                console.log('Attempting to insert transaction record...');
                console.log('Supabase URL configured:', !!process.env.SUPABASE_URL);
                console.log('Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
                console.log('Anon Key configured:', !!process.env.SUPABASE_ANON_KEY);
                
                const { data, error } = await supabase
                    .from('transactions')
                    .insert([
                        {
                            checkout_request_id: response.data.CheckoutRequestID,
                            merchant_request_id: response.data.MerchantRequestID,
                            phone_number: phoneNumber.toString(),
                            amount: amount,
                            status: 'initiated',
                            user_id: userId, // Link to authenticated user
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select();
                
                if (error) {
                    console.error('❌ DATABASE INSERT FAILED:', {
                        error: error,
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    throw error;
                }
                
                console.log('✅ Initial transaction record created successfully:', data);
            } catch (dbError) {
                console.error('❌ Failed to create initial transaction record:', {
                    name: dbError.name,
                    message: dbError.message,
                    stack: dbError.stack
                });
                // Don't fail the request if DB insert fails
            }
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data)
        };
        
    } catch (error) {
        console.error('Payment error:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });
        
        // Provide detailed error information
        const errorMessage = error.response?.data?.errorMessage 
            || error.response?.data?.error
            || error.message 
            || 'Unknown error occurred';
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Payment failed',
                message: errorMessage,
                details: error.response?.data || null
            })
        };
    }
};
