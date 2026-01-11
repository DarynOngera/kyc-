const { getSupabaseClient } = require('../utils/supabase');
const { sendOrderConfirmationEmail } = require('../utils/email');

function parseKesAmount(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const cleaned = String(value || '')
        .replace(/KSh\s?/i, '')
        .replace(/KES\s?/i, '')
        .replace(/,/g, '')
        .trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
}

async function create(req, res) {
    try {
        const { transactionId, userId, cartItems } = req.body || {};

        if (!transactionId || !userId || !cartItems || !Array.isArray(cartItems)) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['transactionId', 'userId', 'cartItems']
            });
        }

        const supabase = getSupabaseClient();

        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (txError || !transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status !== 'completed') {
            return res.status(400).json({ error: 'Transaction not completed' });
        }

        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('transaction_id', transactionId)
            .maybeSingle();

        if (existingOrder) {
            return res.status(200).json({
                success: true,
                message: 'Order already exists',
                order: existingOrder
            });
        }

        const orderNumber = `KYC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const totalAmount = cartItems.reduce((sum, item) => {
            return sum + (parseKesAmount(item.price) * item.quantity);
        }, 0);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([
                {
                    user_id: userId,
                    transaction_id: transactionId,
                    order_number: orderNumber,
                    total_amount: totalAmount,
                    status: 'confirmed',
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return res.status(500).json({
                error: 'Failed to create order',
                message: orderError.message
            });
        }

        const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_name: item.title || item.name,
            quantity: item.quantity,
            unit_price: parseKesAmount(item.price),
            subtotal: parseKesAmount(item.price) * item.quantity,
            created_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items creation error:', itemsError);
        }

        const { error: cartError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (cartError) {
            console.error('Cart clear error:', cartError);
        }

        console.log('Fetching user details for email, userId:', userId);
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user for email:', userError);
        }

        if (user && user.email) {
            try {
                console.log('📧 Attempting to send order confirmation email to:', user.email);

                const emailResult = await sendOrderConfirmationEmail(user.email, {
                    customerName: user.full_name,
                    orderNumber: order.order_number,
                    amount: totalAmount,
                    items: cartItems.map(item => ({
                        name: item.title || item.name,
                        quantity: item.quantity,
                        price: parseFloat(item.price)
                    })),
                    paymentPending: false
                });

                console.log('✅ Order confirmation email sent successfully:', emailResult);
            } catch (emailError) {
                console.error('❌ Failed to send order confirmation email:', {
                    error: emailError.message,
                    stack: emailError.stack,
                    details: emailError
                });
            }
        } else {
            console.log('⚠️ No user email found, skipping order confirmation email');
            console.log('User data:', user);
        }

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: {
                id: order.id,
                orderNumber: order.order_number,
                totalAmount: order.total_amount,
                status: order.status,
                mpesaReceipt: transaction.mpesa_receipt
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

module.exports = create;
