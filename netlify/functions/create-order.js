// Create Order Function
const { getSupabaseClient } = require('./utils/supabase');
const { sendOrderConfirmationEmail } = require('./utils/email');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        const { transactionId, userId, cartItems } = JSON.parse(event.body);
        
        // Validate input
        if (!transactionId || !userId || !cartItems || !Array.isArray(cartItems)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required fields',
                    required: ['transactionId', 'userId', 'cartItems']
                })
            };
        }
        
        const supabase = getSupabaseClient();
        
        // Get transaction details
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();
        
        if (txError || !transaction) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Transaction not found' })
            };
        }
        
        // Verify transaction is completed
        if (transaction.status !== 'completed') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Transaction not completed' })
            };
        }
        
        // Check if order already exists for this transaction
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('transaction_id', transactionId)
            .single();
        
        if (existingOrder) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Order already exists',
                    order: existingOrder
                })
            };
        }
        
        // Generate order number
        const orderNumber = `KYC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Calculate total from cart items
        const totalAmount = cartItems.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);
        
        // Create order
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
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Failed to create order',
                    message: orderError.message 
                })
            };
        }
        
        // Create order items
        const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_name: item.title || item.name,
            quantity: item.quantity,
            unit_price: parseFloat(item.price),
            subtotal: parseFloat(item.price) * item.quantity,
            created_at: new Date().toISOString()
        }));
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
        
        if (itemsError) {
            console.error('Order items creation error:', itemsError);
            // Order created but items failed - log but don't fail
        }
        
        // Clear user's cart
        const { error: cartError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);
        
        if (cartError) {
            console.error('Cart clear error:', cartError);
            // Cart clear failed - log but don't fail
        }
        
        // Get user details for email
        const { data: user } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();
        
        // Send order confirmation email
        if (user && user.email) {
            try {
                console.log('Sending order confirmation email to:', user.email);
                await sendOrderConfirmationEmail(user.email, {
                    customerName: user.full_name,
                    orderNumber: order.order_number,
                    amount: totalAmount,
                    items: cartItems.map(item => ({
                        name: item.title || item.name,
                        quantity: item.quantity,
                        price: parseFloat(item.price)
                    })),
                    paymentPending: false // Order is created after payment completes
                });
                console.log('✅ Order confirmation email sent successfully');
            } catch (emailError) {
                console.error('❌ Failed to send order confirmation email:', emailError);
                // Don't fail the order creation if email fails
            }
        }
        
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Order created successfully',
                order: {
                    id: order.id,
                    orderNumber: order.order_number,
                    totalAmount: order.total_amount,
                    status: order.status,
                    mpesaReceipt: transaction.mpesa_receipt
                }
            })
        };
        
    } catch (error) {
        console.error('Create order error:', error);
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
