// Netlify Function for M-Pesa Callback
exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        const callbackData = JSON.parse(event.body);
        
        console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));
        
        const { Body } = callbackData;
        
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
                    // You can use Netlify's database integrations or external services
                }
            } else {
                // Payment failed
                console.log('❌ Payment failed:', ResultDesc);
            }
        }
        
        // Always respond with success to M-Pesa
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ResultCode: 0,
                ResultDesc: 'Success'
            })
        };
        
    } catch (error) {
        console.error('Callback error:', error);
        
        // Still return success to M-Pesa
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ResultCode: 0,
                ResultDesc: 'Success'
            })
        };
    }
};
