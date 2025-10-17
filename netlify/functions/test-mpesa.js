// Test M-Pesa Configuration
const axios = require('axios');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };
    
    try {
        console.log('Testing M-Pesa credentials...');
        
        // Check environment variables
        const config = {
            consumerKey: process.env.MPESA_CONSUMER_KEY,
            consumerSecret: process.env.MPESA_CONSUMER_SECRET,
            shortcode: process.env.MPESA_SHORTCODE,
            passkey: process.env.MPESA_PASSKEY,
            callbackUrl: process.env.MPESA_CALLBACK_URL
        };
        
        console.log('Config check:', {
            hasConsumerKey: !!config.consumerKey,
            consumerKeyLength: config.consumerKey?.length,
            hasConsumerSecret: !!config.consumerSecret,
            consumerSecretLength: config.consumerSecret?.length,
            shortcode: config.shortcode,
            hasPasskey: !!config.passkey,
            passkeyLength: config.passkey?.length,
            callbackUrl: config.callbackUrl
        });
        
        // Test token generation
        const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
        
        console.log('Attempting to get access token...');
        
        const tokenResponse = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        
        console.log('Token obtained successfully!');
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'M-Pesa credentials are valid',
                config: {
                    shortcode: config.shortcode,
                    callbackUrl: config.callbackUrl,
                    tokenExpiry: tokenResponse.data.expires_in
                },
                token: tokenResponse.data.access_token.substring(0, 20) + '...'
            })
        };
        
    } catch (error) {
        console.error('M-Pesa test error:', error.response?.data || error.message);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.response?.data || error.message,
                message: 'M-Pesa credentials test failed'
            })
        };
    }
};
