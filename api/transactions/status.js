const { getSupabaseClient } = require('../utils/supabase');

async function status(req, res) {
    try {
        const checkoutRequestId = req.query?.checkoutRequestId;

        if (!checkoutRequestId) {
            return res.status(400).json({ error: 'checkoutRequestId is required' });
        }

        const supabase = getSupabaseClient();

        const { data: transaction, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('checkout_request_id', checkoutRequestId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                error: 'Database error',
                message: error.message
            });
        }

        if (!transaction) {
            return res.status(200).json({
                status: 'pending',
                message: 'Waiting for payment confirmation...'
            });
        }

        return res.status(200).json({
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
        });
    } catch (error) {
        console.error('Status check error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

module.exports = status;
