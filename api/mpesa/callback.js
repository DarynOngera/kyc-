const { sendTransactionEmail, sendAdminNotification } = require('../utils/email');
const { normalizeKenyanPhone } = require('../utils/phone');
const db = require('../utils/db');

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

async function findUserByPhone(phoneNumber) {
    const normalized = normalizeKenyanPhone(phoneNumber);
    if (!normalized) return null;

    const candidates = Array.from(new Set([
        normalized,
        `+${normalized}`,
        normalized.replace(/^254/, '0')
    ]));

    for (const candidate of candidates) {
        const result = await db.query(
            'SELECT * FROM users WHERE phone_number = $1 LIMIT 1',
            [candidate]
        );
        const userData = result.rows[0];
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
                        const normalizedPhone = normalizeKenyanPhone(phoneNumber);

                        let transaction = null;
                        {
                            const r = await db.query(
                                'SELECT * FROM transactions WHERE checkout_request_id = $1 ORDER BY created_at DESC LIMIT 1',
                                [CheckoutRequestID]
                            );
                            transaction = r.rows[0] || null;
                        }

                        if (!transaction && MerchantRequestID) {
                            const r = await db.query(
                                'SELECT * FROM transactions WHERE merchant_request_id = $1 ORDER BY created_at DESC LIMIT 1',
                                [MerchantRequestID]
                            );
                            transaction = r.rows[0] || null;
                        }

                        if (!transaction && normalizedPhone) {
                            const r = await db.query(
                                "SELECT * FROM transactions WHERE phone_number = $1 AND status = 'initiated' ORDER BY created_at DESC LIMIT 1",
                                [normalizedPhone]
                            );
                            transaction = r.rows[0] || null;
                        }

                        let transactionError = null;
                        if (transaction) {
                            try {
                                const u = await db.query(
                                    'UPDATE transactions SET mpesa_receipt = $1, amount = $2, phone_number = $3, transaction_date = $4, status = $5, result_code = $6, result_desc = $7, updated_at = $8 WHERE id = $9 RETURNING *',
                                    [
                                        mpesaReceiptNumber,
                                        amount,
                                        normalizedPhone || phoneNumber?.toString(),
                                        parseMpesaDate(transactionDate),
                                        'completed',
                                        ResultCode,
                                        ResultDesc,
                                        new Date().toISOString(),
                                        transaction.id
                                    ]
                                );
                                transaction = u.rows[0] || transaction;
                            } catch (e) {
                                transactionError = e;
                            }
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
                                const r = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [transaction.user_id]);
                                user = r.rows[0] || null;
                            }

                            if (!user) {
                                user = await findUserByPhone(normalizedPhone || phoneNumber);
                                if (user && !transaction.user_id) {
                                    await db.query(
                                        'UPDATE transactions SET user_id = $1, updated_at = $2 WHERE id = $3',
                                        [user.id, new Date().toISOString(), transaction.id]
                                    );
                                }
                            }

                            if (user) {
                                console.log('User found:', user.email);

                                const cartResult = await db.query(
                                    'SELECT ci.quantity, p.name, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1',
                                    [user.id]
                                );
                                const cartItems = cartResult.rows;

                                const items = cartItems ? cartItems.map(item => ({
                                    name: item.name,
                                    quantity: item.quantity,
                                    price: item.price
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
                                        await db.query('DELETE FROM cart_items WHERE user_id = $1', [user.id]);
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
                    await db.query(
                        'UPDATE transactions SET status = $1, result_code = $2, result_desc = $3, updated_at = $4 WHERE checkout_request_id = $5',
                        ['failed', ResultCode, ResultDesc, new Date().toISOString(), CheckoutRequestID]
                    );
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
                let transaction = null;
                {
                    const r = await db.query(
                        'SELECT * FROM transactions WHERE checkout_request_id = $1 ORDER BY created_at DESC LIMIT 1',
                        [MessageReference]
                    );
                    transaction = r.rows[0] || null;
                }

                if (!transaction && normalizedPhone) {
                    const r = await db.query(
                        "SELECT * FROM transactions WHERE phone_number = $1 AND status = 'initiated' ORDER BY created_at DESC LIMIT 1",
                        [normalizedPhone]
                    );
                    transaction = r.rows[0] || null;
                }

                let transactionError = null;
                if (transaction) {
                    try {
                        const u = await db.query(
                            'UPDATE transactions SET mpesa_receipt = $1, amount = $2, phone_number = $3, transaction_date = $4, status = $5, result_code = $6, result_desc = $7, updated_at = $8 WHERE id = $9 RETURNING *',
                            [
                                ReceiptNumber || null,
                                Amount ?? transaction.amount,
                                normalizedPhone || MobileNumber?.toString() || transaction.phone_number,
                                TransactionDate ? new Date(TransactionDate).toISOString() : new Date().toISOString(),
                                status,
                                ResultCode,
                                ResultDesc,
                                new Date().toISOString(),
                                transaction.id
                            ]
                        );
                        transaction = u.rows[0] || transaction;
                    } catch (e) {
                        transactionError = e;
                    }
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
                        const r = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [transaction.user_id]);
                        user = r.rows[0] || null;
                    }

                    if (!user) {
                        user = await findUserByPhone(normalizedPhone || MobileNumber);
                        if (user && !transaction.user_id) {
                            await db.query(
                                'UPDATE transactions SET user_id = $1, updated_at = $2 WHERE id = $3',
                                [user.id, new Date().toISOString(), transaction.id]
                            );
                        }
                    }

                    if (user) {
                        const cartResult = await db.query(
                            'SELECT ci.quantity, p.name, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = $1',
                            [user.id]
                        );
                        const cartItems = cartResult.rows;

                        const items = cartItems ? cartItems.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price
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
                                    items: items,
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
                                items: items
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
                                await db.query('DELETE FROM cart_items WHERE user_id = $1', [user.id]);
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
