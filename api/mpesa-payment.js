// Vercel Serverless Function
// Deploy to Vercel and this becomes: https://yourdomain.vercel.app/api/mpesa-payment

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

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { phoneNumber, amount, accountReference } = req.body;
        
        const token = await getAccessToken();
        const timestamp = generateTimestamp();
        const password = generatePassword(
            process.env.MPESA_SHORTCODE,
            process.env.MPESA_PASSKEY,
            timestamp
        );
        
        const requestBody = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.round(amount),
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: accountReference || 'KejaYaCapo',
            TransactionDesc: 'Payment for KejaYaCapo Order'
        };
        
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
        
        res.status(200).json(response.data);
        
    } catch (error) {
        console.error('Payment error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Payment failed',
            message: error.response?.data || error.message 
        });
    }
};
