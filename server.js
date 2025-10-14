/**
 * Backend Server for M-Pesa Integration
 * Run with: node server.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json());
app.use(express.static('.')); // Serve static files

// ===================================
// Utility Functions
// ===================================
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

// ===================================
// Get M-Pesa Access Token
// ===================================
async function getAccessToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw new Error('Failed to get access token');
    }
}

// ===================================
// API Endpoints
// ===================================

// Get Access Token (for frontend if needed)
app.post('/api/mpesa/token', async (req, res) => {
    try {
        const token = await getAccessToken();
        res.json({ token });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get access token',
            message: error.message 
        });
    }
});

// Initiate STK Push Payment
app.post('/api/mpesa/payment', async (req, res) => {
    const { phoneNumber, amount, accountReference } = req.body;
    
    // Validate input
    if (!phoneNumber || !amount) {
        return res.status(400).json({ 
            error: 'Phone number and amount are required' 
        });
    }
    
    try {
        // Get access token
        const token = await getAccessToken();
        
        // Generate timestamp and password
        const timestamp = generateTimestamp();
        const password = generatePassword(
            process.env.MPESA_SHORTCODE,
            process.env.MPESA_PASSKEY,
            timestamp
        );
        
        // Prepare request body
        const requestBody = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.round(amount), // Ensure integer
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: accountReference || 'KejaYaCapo',
            TransactionDesc: `Payment for KejaYaCapo Order`
        };
        
        console.log('Initiating STK Push:', {
            phone: phoneNumber,
            amount: amount,
            timestamp: timestamp
        });
        
        // Make API call to M-Pesa
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
        
        console.log('M-Pesa Response:', response.data);
        res.json(response.data);
        
    } catch (error) {
        console.error('Payment error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Payment failed',
            message: error.response?.data || error.message 
        });
    }
});

// M-Pesa Callback Endpoint
app.post('/api/mpesa/callback', async (req, res) => {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));
    
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
        const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
        
        if (ResultCode === 0) {
            // Payment successful
            console.log('✅ Payment successful!');
            
            if (CallbackMetadata && CallbackMetadata.Item) {
                const metadata = CallbackMetadata.Item;
                const amount = metadata.find(item => item.Name === 'Amount')?.Value;
                const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
                const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
                
                console.log('Payment Details:', {
                    receipt: mpesaReceiptNumber,
                    amount,
                    phone: phoneNumber
                });
                
                // TODO: Update order status in database
                // await updateOrderStatus({ receipt: mpesaReceiptNumber, amount, phoneNumber });
            }
        } else {
            // Payment failed
            console.log('❌ Payment failed:', ResultDesc);
        }
    }
    
    // Always respond with success to M-Pesa
    res.json({ 
        ResultCode: 0, 
        ResultDesc: 'Success' 
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// ===================================
// Start Server
// ===================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 M-Pesa API endpoints ready`);
    console.log(`   - POST /api/mpesa/payment`);
    console.log(`   - POST /api/mpesa/callback`);
});
