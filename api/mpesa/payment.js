const axios = require('axios');

function getMpesaBaseURL() {
    const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    const baseURL = environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    console.log(`🌍 M-Pesa Environment: ${environment.toUpperCase()}`);
    console.log(`📡 Using base URL: ${baseURL}`);

    return baseURL;
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

    if (!consumerKey || !consumerSecret) {
        throw new Error('M-Pesa credentials not configured');
    }

    const cleanKey = consumerKey.trim();
    const cleanSecret = consumerSecret.trim();

    if (cleanKey.includes(' ') || cleanSecret.includes(' ')) {
        throw new Error('M-Pesa credentials contain spaces - please check your environment variables');
    }

    const auth = Buffer.from(`${cleanKey}:${cleanSecret}`).toString('base64');

    console.log('Attempting token request with key length:', cleanKey.length, 'secret length:', cleanSecret.length);

    const baseURL = getMpesaBaseURL();

    try {
        const response = await axios.get(
            `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
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

async function payment(req, res) {
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
        console.error('Missing M-Pesa credentials in environment variables');
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'M-Pesa credentials not configured. Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.'
        });
    }

    const { phoneNumber, amount, accountReference } = req.body || {};

    let userId = null;
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
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

    if (!phoneNumber || !amount) {
        return res.status(400).json({ error: 'Phone number and amount are required' });
    }

    console.log('Processing payment:', { phoneNumber, amount });

    try {
        const token = await getAccessToken();

        const timestamp = generateTimestamp();
        const password = generatePassword(
            process.env.MPESA_SHORTCODE,
            process.env.MPESA_PASSKEY,
            timestamp
        );

        const callbackUrl = process.env.MPESA_CALLBACK_URL;
        if (!callbackUrl) {
            console.warn('MPESA_CALLBACK_URL not set; STK push will use fallback (not recommended for EC2)');
        }

        const requestBody = {
            BusinessShortCode: parseInt(process.env.MPESA_SHORTCODE),
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: parseInt(phoneNumber),
            PartyB: parseInt(process.env.MPESA_SHORTCODE),
            PhoneNumber: parseInt(phoneNumber),
            CallBackURL: callbackUrl || 'http://localhost:3000/api/mpesa/callback',
            AccountReference: accountReference || 'KejaYaCapo',
            TransactionDesc: 'Payment for KejaYaCapo Order'
        };

        console.log('Request body prepared:', JSON.stringify(requestBody, null, 2));

        const baseURL = getMpesaBaseURL();

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

        console.log('M-Pesa response:', response.data);

        if (response.data.CheckoutRequestID) {
            try {
                const { getSupabaseClient } = require('../utils/supabase');
                const supabase = getSupabaseClient();

                const { error } = await supabase
                    .from('transactions')
                    .insert([
                        {
                            checkout_request_id: response.data.CheckoutRequestID,
                            merchant_request_id: response.data.MerchantRequestID,
                            phone_number: String(phoneNumber),
                            amount: amount,
                            status: 'initiated',
                            user_id: userId,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (error) {
                    console.error('❌ DATABASE INSERT FAILED:', {
                        error: error,
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                }
            } catch (dbError) {
                console.error('❌ Failed to create initial transaction record:', {
                    name: dbError.name,
                    message: dbError.message,
                    stack: dbError.stack
                });
            }
        }

        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Payment error:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        const errorMessage = error.response?.data?.errorMessage
            || error.response?.data?.error
            || error.message
            || 'Unknown error occurred';

        return res.status(500).json({
            error: 'Payment failed',
            message: errorMessage,
            details: error.response?.data || null
        });
    }
}

module.exports = payment;
