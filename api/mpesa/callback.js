const { getSupabaseClient } = require('../utils/supabase');
const { sendTransactionEmail, sendAdminNotification } = require('../utils/email');
const { normalizeKenyanPhone } = require('../utils/phone');

function parseMpesaDate(mpesaDateString) {
    if (!mpesaDateString) return new Date().toISOString();

    try {
        const dateStr = mpesaDateString.toString();
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const hour = dateStr.substring(8, 10);
        const minute = dateStr.substring(10, 12);
        const second = dateStr.substring(12, 14);

        const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`;
        return new Date(isoString).toISOString();
    } catch (error) {
        console.error('Error parsing M-Pesa date:', error);
        return new Date().toISOString();
    }
}

async function findUserByPhone(supabase, phoneNumber) {
    const normalized = normalizeKenyanPhone(phoneNumber);
    if (!normalized) return null;

    const candidates = Array.from(new Set([
        normalized,
        `+${normalized}`,
        normalized.replace(/^254/, '0')
    ]));

    for (const candidate of candidates) {
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', candidate)
            .maybeSingle();
        if (userData) return userData;
    }

    return null;
}

async function callback(req, res) {
    try {
        const callbackData = req.body;
        console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

        const { Body } = callbackData || {};

        if (Body && Body.stkCallback) {
            const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID, MerchantRequestID } = Body.stkCallback;

            if (ResultCode === 0) {
                console.log('Payment successful!');

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

                        const normalizedPhone = normalizeKenyanPhone(phoneNumber);

                        let transaction = null;
                        const { data: existingByCheckout } = await supabase
                            .from('transactions')
                            .select('*')
                            .eq('checkout_request_id', CheckoutRequestID)
                            .maybeSingle();
                        if (existingByCheckout) transaction = existingByCheckout;

                        if (!transaction && MerchantRequestID) {
                            const { data: existingByMerchant } = await supabase
                                .from('transactions')
                                .select('*')
                                .eq('merchant_request_id', MerchantRequestID)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();
                            if (existingByMerchant) transaction = existingByMerchant;
                        }

                        if (!transaction && normalizedPhone) {
                            const { data: existingByPhone } = await supabase
                                .from('transactions')
                                .select('*')
                                .eq('phone_number', normalizedPhone)
                                .eq('status', 'initiated')
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();
                            if (existingByPhone) transaction = existingByPhone;
                        }

                        let transactionError = null;
                        if (transaction) {
                            const { data: updatedTx, error } = await supabase
                                .from('transactions')
                                .update({
                                    mpesa_receipt: mpesaReceiptNumber,
                                    amount: amount,
                                    phone_number: normalizedPhone || phoneNumber?.toString(),
                                    transaction_date: parseMpesaDate(transactionDate),
                                    status: 'completed',
                                    result_code: ResultCode,
                                    result_desc: ResultDesc,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', transaction.id)
                                .select()
                                .single();

                            transactionError = error;
                            if (!error) transaction = updatedTx;
                        } else {
                            transactionError = new Error('Transaction not found for callback');
                            console.error('⚠️ No transaction row matched callback:', {
                                CheckoutRequestID,
                                MerchantRequestID,
                                phoneNumber: normalizedPhone || phoneNumber
                            });
                        }

                        if (transactionError) {
                            console.error('Failed to log transaction:', transactionError);
                        } else {
                            console.log('Transaction logged successfully:', transaction.id);

                            let user = null;
                            if (transaction.user_id) {
                                const { data: userData } = await supabase
                                    .from('users')
                                    .select('*')
                                    .eq('id', transaction.user_id)
                                    .single();
                                user = userData;
                            }

                            if (!user) {
                                user = await findUserByPhone(supabase, normalizedPhone || phoneNumber);
                                if (user && !transaction.user_id) {
                                    await supabase
                                        .from('transactions')
                                        .update({ user_id: user.id, updated_at: new Date().toISOString() })
                                        .eq('id', transaction.id);
                                }
                            }

                            if (user) {
                                console.log('User found:', user.email);

                                const { data: cartItems } = await supabase
                                    .from('cart_items')
                                    .select('*, products(*)')
                                    .eq('user_id', user.id);

                                const items = cartItems ? cartItems.map(item => ({
                                    name: item.products.name,
                                    quantity: item.quantity,
                                    price: item.products.price
                                })) : null;

                                try {
                                    console.log('Attempting to send customer email to:', user.email);
                                    const emailResult = await sendTransactionEmail(
                                        user.email,
                                        `Order Confirmation - ${mpesaReceiptNumber}`,
                                        {
                                            customerName: user.full_name,
                                            orderId: mpesaReceiptNumber,
                                            amount: amount,
                                            mpesaReceipt: mpesaReceiptNumber,
                                            phoneNumber: (normalizedPhone || phoneNumber)?.toString(),
                                            items: items,
                                            status: 'completed'
                                        }
                                    );
                                    console.log('✅ Customer email sent successfully:', emailResult);
                                } catch (emailError) {
                                    console.error('❌ Failed to send customer email:', {
                                        error: emailError.message,
                                        stack: emailError.stack,
                                        details: emailError
                                    });
                                }

                                try {
                                    console.log('Attempting to send admin notification');
                                    const adminResult = await sendAdminNotification({
                                        customerName: user.full_name,
                                        customerEmail: user.email,
                                        orderId: mpesaReceiptNumber,
                                        amount: amount,
                                        mpesaReceipt: mpesaReceiptNumber,
                                        phoneNumber: (normalizedPhone || phoneNumber)?.toString(),
                                        items: items
                                    });
                                    console.log('✅ Admin notification sent successfully:', adminResult);
                                } catch (emailError) {
                                    console.error('❌ Failed to send admin notification:', {
                                        error: emailError.message,
                                        stack: emailError.stack,
                                        details: emailError
                                    });
                                }

                                if (cartItems && cartItems.length > 0) {
                                    try {
                                        await supabase
                                            .from('cart_items')
                                            .delete()
                                            .eq('user_id', user.id);
                                        console.log('Cart cleared for user:', user.id);
                                    } catch (cartError) {
                                        console.error('Failed to clear cart for user:', user.id, cartError);
                                    }
                                }
                            } else {
                                console.log('⚠️ No user found for transaction:', {
                                    transactionId: transaction.id,
                                    userId: transaction.user_id,
                                    phoneNumber: phoneNumber
                                });
                            }
                        }
                    } catch (dbError) {
                        console.error('Database operation error:', dbError);
                    }
                }
            } else {
                console.log('❌ Payment failed:', ResultDesc);

                try {
                    const supabase = getSupabaseClient();
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

        if (callbackData && callbackData.MessageReference) {
            const {
                MessageReference,
                ResultCode,
                ResultDesc,
                Amount,
                MobileNumber,
                TransactionDate,
                ReceiptNumber
            } = callbackData;

            const normalizedPhone = normalizeKenyanPhone(MobileNumber);
            const status = Number(ResultCode) === 0 ? 'completed' : 'failed';

            try {
                const supabase = getSupabaseClient();

                let transaction = null;
                const { data: existingByRef } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('checkout_request_id', MessageReference)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (existingByRef) transaction = existingByRef;

                if (!transaction && normalizedPhone) {
                    const { data: existingByPhone } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('phone_number', normalizedPhone)
                        .eq('status', 'initiated')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    if (existingByPhone) transaction = existingByPhone;
                }

                let transactionError = null;
                if (transaction) {
                    const { data: updatedTx, error } = await supabase
                        .from('transactions')
                        .update({
                            mpesa_receipt: ReceiptNumber || null,
                            amount: Amount ?? transaction.amount,
                            phone_number: normalizedPhone || MobileNumber?.toString() || transaction.phone_number,
                            transaction_date: TransactionDate ? new Date(TransactionDate).toISOString() : new Date().toISOString(),
                            status,
                            result_code: ResultCode,
                            result_desc: ResultDesc,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', transaction.id)
                        .select()
                        .single();

                    transactionError = error;
                    if (!error) transaction = updatedTx;
                } else {
                    transactionError = new Error('Transaction not found for Co-op callback');
                    console.error('⚠️ No transaction row matched Co-op callback:', {
                        MessageReference,
                        phoneNumber: normalizedPhone || MobileNumber
                    });
                }

                if (transactionError) {
                    console.error('Failed to log Co-op transaction:', transactionError);
                } else if (status === 'completed') {
                    let user = null;
                    if (transaction.user_id) {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', transaction.user_id)
                            .single();
                        user = userData;
                    }

                    if (!user) {
                        user = await findUserByPhone(supabase, normalizedPhone || MobileNumber);
                        if (user && !transaction.user_id) {
                            await supabase
                                .from('transactions')
                                .update({ user_id: user.id, updated_at: new Date().toISOString() })
                                .eq('id', transaction.id);
                        }
                    }

                    if (user) {
                        const { data: cartItems } = await supabase
                            .from('cart_items')
                            .select('*, products(*)')
                            .eq('user_id', user.id);

                        const items = cartItems ? cartItems.map(item => ({
                            name: item.products.name,
                            quantity: item.quantity,
                            price: item.products.price
                        })) : null;

                        try {
                            await sendTransactionEmail(
                                user.email,
                                `Order Confirmation - ${ReceiptNumber || MessageReference}`,
                                {
                                    customerName: user.full_name,
                                    orderId: ReceiptNumber || MessageReference,
                                    amount: Amount,
                                    mpesaReceipt: ReceiptNumber || MessageReference,
                                    phoneNumber: (normalizedPhone || MobileNumber)?.toString(),
                                    items,
                                    status: 'completed'
                                }
                            );
                        } catch (emailError) {
                            console.error('❌ Failed to send customer email (Co-op):', {
                                error: emailError.message,
                                stack: emailError.stack,
                                details: emailError
                            });
                        }

                        try {
                            await sendAdminNotification({
                                customerName: user.full_name,
                                customerEmail: user.email,
                                orderId: ReceiptNumber || MessageReference,
                                amount: Amount,
                                mpesaReceipt: ReceiptNumber || MessageReference,
                                phoneNumber: (normalizedPhone || MobileNumber)?.toString(),
                                items
                            });
                        } catch (emailError) {
                            console.error('❌ Failed to send admin notification (Co-op):', {
                                error: emailError.message,
                                stack: emailError.stack,
                                details: emailError
                            });
                        }

                        if (cartItems && cartItems.length > 0) {
                            try {
                                await supabase
                                    .from('cart_items')
                                    .delete()
                                    .eq('user_id', user.id);
                            } catch (cartError) {
                                console.error('Failed to clear cart for user:', user.id, cartError);
                            }
                        }
                    }
                }
            } catch (dbError) {
                console.error('Co-op callback DB error:', dbError);
            }
        }

        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        console.error('Callback error:', error);
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }
}

module.exports = callback;
