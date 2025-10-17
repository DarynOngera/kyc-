// Netlify Function for M-Pesa Callback with Transaction Logging
const { getSupabaseClient } = require('./utils/supabase');
const { sendTransactionEmail, sendAdminNotification } = require('./utils/email');

// Helper function to parse M-Pesa date format (YYYYMMDDHHmmss)
function parseMpesaDate(mpesaDateString) {
    if (!mpesaDateString) return new Date().toISOString();
    
    try {
        const dateStr = mpesaDateString.toString();
        // Format: YYYYMMDDHHmmss (e.g., 20251017140548)
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const hour = dateStr.substring(8, 10);
        const minute = dateStr.substring(10, 12);
        const second = dateStr.substring(12, 14);
        
        // Create ISO string: YYYY-MM-DDTHH:mm:ss
        const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`; // EAT timezone
        return new Date(isoString).toISOString();
    } catch (error) {
        console.error('Error parsing M-Pesa date:', error);
        return new Date().toISOString();
    }
}

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
            const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID, MerchantRequestID } = Body.stkCallback;
            
            if (ResultCode === 0) {
                // Payment successful
                console.log('✅ Payment successful!');
                
                if (CallbackMetadata && CallbackMetadata.Item) {
                    const metadata = CallbackMetadata.Item;
                    const amount = metadata.find(item => item.Name === 'Amount')?.Value;
                    const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
                    const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
                    const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
                    
                    console.log('Payment Details:', {
                        receipt: mpesaReceiptNumber,
                        amount,
                        phone: phoneNumber,
                        date: transactionDate
                    });
                    
                    try {
                        const supabase = getSupabaseClient();
                        
                        // Update existing transaction record
                        const { data: transaction, error: transactionError } = await supabase
                            .from('transactions')
                            .update({
                                mpesa_receipt: mpesaReceiptNumber,
                                amount: amount,
                                phone_number: phoneNumber.toString(),
                                transaction_date: parseMpesaDate(transactionDate),
                                status: 'completed',
                                result_code: ResultCode,
                                result_desc: ResultDesc,
                                updated_at: new Date().toISOString()
                            })
                            .eq('checkout_request_id', CheckoutRequestID)
                            .select()
                            .single();
                        
                        if (transactionError) {
                            console.error('Failed to log transaction:', transactionError);
                        } else {
                            console.log('Transaction logged successfully:', transaction.id);
                            
                            // Try to find the user by phone number
                            const { data: user } = await supabase
                                .from('users')
                                .select('*')
                                .eq('phone_number', phoneNumber.toString())
                                .single();
                            
                            if (user) {
                                // Update transaction with user_id
                                await supabase
                                    .from('transactions')
                                    .update({ user_id: user.id })
                                    .eq('id', transaction.id);
                                
                                // Get cart items if available
                                const { data: cartItems } = await supabase
                                    .from('cart_items')
                                    .select('*, products(*)')
                                    .eq('user_id', user.id);
                                
                                const items = cartItems ? cartItems.map(item => ({
                                    name: item.products.name,
                                    quantity: item.quantity,
                                    price: item.products.price
                                })) : null;
                                
                                // Send customer email
                                try {
                                    await sendTransactionEmail(
                                        user.email,
                                        `Order Confirmation - ${mpesaReceiptNumber}`,
                                        {
                                            customerName: user.full_name,
                                            orderId: mpesaReceiptNumber,
                                            amount: amount,
                                            mpesaReceipt: mpesaReceiptNumber,
                                            phoneNumber: phoneNumber.toString(),
                                            items: items,
                                            status: 'completed'
                                        }
                                    );
                                    console.log('Customer email sent successfully');
                                } catch (emailError) {
                                    console.error('Failed to send customer email:', emailError);
                                }
                                
                                // Send admin notification
                                try {
                                    await sendAdminNotification({
                                        customerName: user.full_name,
                                        customerEmail: user.email,
                                        orderId: mpesaReceiptNumber,
                                        amount: amount,
                                        mpesaReceipt: mpesaReceiptNumber,
                                        phoneNumber: phoneNumber.toString(),
                                        items: items
                                    });
                                    console.log('Admin notification sent successfully');
                                } catch (emailError) {
                                    console.error('Failed to send admin notification:', emailError);
                                }
                                
                                // Clear user's cart after successful payment
                                if (cartItems && cartItems.length > 0) {
                                    await supabase
                                        .from('cart_items')
                                        .delete()
                                        .eq('user_id', user.id);
                                    console.log('Cart cleared for user:', user.id);
                                }
                            } else {
                                console.log('No user found for phone number:', phoneNumber);
                            }
                        }
                    } catch (dbError) {
                        console.error('Database operation error:', dbError);
                    }
                }
            } else {
                // Payment failed
                console.log('❌ Payment failed:', ResultDesc);
                
                try {
                    const supabase = getSupabaseClient();
                    
                    // Update transaction as failed
                    await supabase
                        .from('transactions')
                        .update({
                            status: 'failed',
                            result_code: ResultCode,
                            result_desc: ResultDesc,
                            updated_at: new Date().toISOString()
                        })
                        .eq('checkout_request_id', CheckoutRequestID);
                } catch (dbError) {
                    console.error('Failed to update failed transaction:', dbError);
                }
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
