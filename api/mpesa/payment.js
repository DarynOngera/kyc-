const axios = require('axios');
const crypto = require('crypto');

 let coopTokenCache = {
     accessToken: null,
     expiresAtMs: 0
 };

 function getPaymentProvider() {
     return (process.env.PAYMENT_PROVIDER || 'mpesa').toLowerCase();
 }

 function maskPhone(phoneNumber) {
     const s = phoneNumber == null ? '' : String(phoneNumber);
     if (s.length <= 5) return s;
     return `${s.slice(0, 3)}***${s.slice(-2)}`;
 }

 function requireEnv(name) {
     const v = process.env[name];
     if (!v) throw new Error(`${name} not configured`);
     return v;
 }

 async function getCoopAccessToken() {
     const now = Date.now();
     if (coopTokenCache.accessToken && coopTokenCache.expiresAtMs && now < coopTokenCache.expiresAtMs - 10_000) {
         return coopTokenCache.accessToken;
     }

     const basicAuth = requireEnv('COOP_BASIC_AUTH').trim();

     const resp = await axios.post(
         'https://openapi.co-opbank.co.ke/token',
         'grant_type=client_credentials',
         {
             headers: {
                 Authorization: `Basic ${basicAuth}`,
                 'Content-Type': 'application/x-www-form-urlencoded'
             },
             timeout: 30_000
         }
     );

     const accessToken = resp.data?.access_token;
     const expiresIn = Number(resp.data?.expires_in || 0);
     if (!accessToken) {
         const e = new Error('Failed to obtain Co-op access token');
         e.code = 'COOP_TOKEN_FAILED';
         e.httpStatus = 502;
         e.coop = { status: resp.status, data: resp.data };
         throw e;
     }

     coopTokenCache.accessToken = accessToken;
     coopTokenCache.expiresAtMs = now + (expiresIn > 0 ? expiresIn * 1000 : 55 * 60 * 1000);
     return accessToken;
 }

 function buildMessageReference() {
     return crypto.randomBytes(8).toString('hex').toUpperCase();
 }

 async function coopStkPush({ phoneNumber, amount, accountReference }) {
     const token = await getCoopAccessToken();
     const callbackUrl = requireEnv('COOP_CALLBACK_URL');
     const operatorCode = requireEnv('COOP_OPERATOR_CODE');

     const messageReference = buildMessageReference();
     const body = {
         MessageReference: messageReference,
         CallBackUrl: callbackUrl,
         OperatorCode: operatorCode,
         TransactionCurrency: 'KES',
         MobileNumber: String(phoneNumber),
         Narration: accountReference || 'KejaYaCapo',
         Amount: Math.round(Number(amount)),
         MessageDateTime: new Date().toISOString(),
         OtherDetails: [
             {
                 Name: 'COOP',
                 Value: 'STKTest'
             }
         ]
     };

     const resp = await axios.post(
         'https://openapi.co-opbank.co.ke/FT/stk/1.0.0',
         body,
         {
             headers: {
                 Authorization: `Bearer ${token}`,
                 'Content-Type': 'application/json'
             },
             timeout: 30_000
         }
     );

     return {
         provider: 'coop',
         messageReference,
         coop: resp.data
     };
 }

function getMpesaBaseURL() {
    const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    const baseURL = environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    console.log(` M-Pesa Environment: ${environment.toUpperCase()}`);
    console.log(` Using base URL: ${baseURL}`);

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

    console.log('Attempting M-Pesa access token request');

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
        console.error('M-Pesa token request failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        const status = error.response?.status;
        if (status === 400 || status === 401 || status === 403) {
            const e = new Error('M-Pesa authentication failed');
            e.code = 'MPESA_AUTH_FAILED';
            e.httpStatus = 502;
            e.mpesa = { status, data: error.response?.data };
            throw e;
        }

        const e = new Error('Failed to get M-Pesa access token');
        e.code = 'MPESA_TOKEN_FAILED';
        e.httpStatus = 502;
        e.mpesa = { status, data: error.response?.data };
        throw e;
    }
}

async function payment(req, res) {
    const provider = getPaymentProvider();

    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
        if (provider === 'mpesa') {
            console.error('Missing M-Pesa credentials in environment variables');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Payment service is not configured.'
            });
        }
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
        if (provider === 'coop') {
            const coopResult = await coopStkPush({ phoneNumber, amount, accountReference });

            try {
                const { getSupabaseClient } = require('../utils/supabase');
                const supabase = getSupabaseClient();

                await supabase
                    .from('transactions')
                    .insert([
                        {
                            checkout_request_id: coopResult.messageReference,
                            merchant_request_id: null,
                            phone_number: String(phoneNumber),
                            amount: amount,
                            status: 'initiated',
                            user_id: userId,
                            created_at: new Date().toISOString()
                        }
                    ]);
            } catch (dbError) {
                console.error('Failed to create initial transaction record:', {
                    name: dbError.name,
                    message: dbError.message,
                    stack: dbError.stack
                });
            }

            console.log('Co-op STK push initiated', {
                amount,
                phoneNumber: maskPhone(phoneNumber),
                messageReference: coopResult.messageReference
            });

            return res.status(200).json({
                CheckoutRequestID: coopResult.messageReference,
                MerchantRequestID: null,
                ResponseCode: '0',
                ResponseDescription: 'Accepted',
                CustomerMessage: 'STK push initiated',
                provider: 'coop',
                coop: coopResult.coop
            });
        }

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

       console.log('STK push initiated', {
           amount,
           phoneNumber,
           shortcode: process.env.MPESA_SHORTCODE
       });


        const baseURL = getMpesaBaseURL();

        console.log('Making request to:', `${baseURL}/mpesa/stkpush/v1/processrequest`);

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
                    console.error('DATABASE INSERT FAILED:', {
                        error: error,
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                }
            } catch (dbError) {
                console.error('Failed to create initial transaction record:', {
                    name: dbError.name,
                    message: dbError.message,
                    stack: dbError.stack
                });
            }
        }

        return res.status(200).json(response.data);
    } catch (error) {
        const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        console.error('Payment error:', {
            requestId,
            code: error.code,
            message: error.message,
            httpStatus: error.httpStatus,
            mpesaStatus: error.response?.status || error.mpesa?.status,
            mpesaData: error.response?.data || error.mpesa?.data,
            stack: error.stack
        });

        const status = Number(error.httpStatus) || 500;

        if (error.code === 'MPESA_AUTH_FAILED') {
            return res.status(status).json({
                error: 'Payment failed',
                message: 'Payment service is temporarily unavailable. Please try again later.',
                requestId
            });
        }

        return res.status(status).json({
            error: 'Payment failed',
            message: 'Payment request failed. Please try again later.',
            requestId
        });
    }
}

module.exports = payment;
