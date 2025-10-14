// Test function to check if environment variables are configured
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
    const envCheck = {
        MPESA_CONSUMER_KEY: !!process.env.MPESA_CONSUMER_KEY,
        MPESA_CONSUMER_SECRET: !!process.env.MPESA_CONSUMER_SECRET,
        MPESA_SHORTCODE: !!process.env.MPESA_SHORTCODE,
        MPESA_PASSKEY: !!process.env.MPESA_PASSKEY,
        MPESA_CALLBACK_URL: !!process.env.MPESA_CALLBACK_URL
    };
    
    const allConfigured = Object.values(envCheck).every(v => v === true);
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            status: allConfigured ? 'OK' : 'INCOMPLETE',
            message: allConfigured 
                ? 'All M-Pesa environment variables are configured' 
                : 'Some M-Pesa environment variables are missing',
            environment: envCheck,
            instructions: allConfigured 
                ? 'You can proceed with testing payments'
                : 'Please configure missing environment variables in Netlify Dashboard → Site Settings → Environment Variables'
        }, null, 2)
    };
};
