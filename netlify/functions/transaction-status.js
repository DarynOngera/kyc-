// Transaction Status Check Function
const { getSupabaseClient } = require('./utils/supabase');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Get checkout request ID from query parameters
        const checkoutRequestId = event.queryStringParameters?.checkoutRequestId;
        
        if (!checkoutRequestId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'checkoutRequestId is required' })
            };
        }
        
        const supabase = getSupabaseClient();
        
        // Query transaction by checkout_request_id
        const { data: transaction, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('checkout_request_id', checkoutRequestId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Database error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Database error',
                    message: error.message 
                })
            };
        }
        
        if (!transaction) {
            // Transaction not yet recorded (callback not received)
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'pending',
                    message: 'Waiting for payment confirmation...'
                })
            };
        }
        
        // Transaction found - return status
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: transaction.status,
                transactionId: transaction.id,
                mpesaReceipt: transaction.mpesa_receipt,
                amount: transaction.amount,
                transactionDate: transaction.transaction_date,
                resultCode: transaction.result_code,
                resultDesc: transaction.result_desc,
                userId: transaction.user_id,
                message: transaction.status === 'completed' 
                    ? 'Payment successful!' 
                    : transaction.status === 'failed'
                    ? 'Payment failed'
                    : 'Payment pending'
            })
        };
        
    } catch (error) {
        console.error('Status check error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};
