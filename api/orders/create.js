const { sendOrderConfirmationEmail } = require('../utils/email');
const db = require('../utils/db');

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

        const txResult = await db.query(
            'SELECT * FROM transactions WHERE id = $1 LIMIT 1',
            [transactionId]
        );

        const transaction = txResult.rows[0];
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        if (transaction.status !== 'completed') {
            return res.status(400).json({ error: 'Transaction not completed' });
        }

        const existingOrderResult = await db.query(
            'SELECT id, order_number FROM orders WHERE transaction_id = $1 LIMIT 1',
            [transactionId]
        );
        const existingOrder = existingOrderResult.rows[0] || null;

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

        const { order, user } = await db.withTransaction(async (client) => {
            const orderInsert = await client.query(
                'INSERT INTO orders (user_id, transaction_id, order_number, total_amount, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
                [userId, transactionId, orderNumber, totalAmount, 'confirmed', new Date().toISOString()]
            );
            const order = orderInsert.rows[0];

            const orderItems = cartItems.map(item => ({
                order_id: order.id,
                product_name: item.title || item.name,
                quantity: item.quantity,
                unit_price: parseKesAmount(item.price),
                subtotal: parseKesAmount(item.price) * item.quantity,
                created_at: new Date().toISOString()
            }));

            for (const item of orderItems) {
                await client.query(
                    'INSERT INTO order_items (order_id, product_name, quantity, unit_price, subtotal, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
                    [item.order_id, item.product_name, item.quantity, item.unit_price, item.subtotal, item.created_at]
                );
            }

            await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

            const userResult = await client.query(
                'SELECT email, full_name FROM users WHERE id = $1 LIMIT 1',
                [userId]
            );
            const user = userResult.rows[0] || null;

            return { order, user };
        });

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
