// Email utility using Resend
const { Resend } = require('resend');

let resend = null;

function getResendClient() {
    if (!resend) {
        const apiKey = process.env.RESEND_API_KEY;
        
        if (!apiKey) {
            throw new Error('Resend API key not configured');
        }
        
        resend = new Resend(apiKey);
    }
    
    return resend;
}

async function sendTransactionEmail(to, subject, data) {
    const resend = getResendClient();
    const fromEmail = process.env.FROM_EMAIL || 'orders@kejayacapo.shop';
    
    try {
        const result = await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            html: generateTransactionEmailHTML(data)
        });
        
        return result;
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
}

function generateTransactionEmailHTML(data) {
    const { 
        customerName, 
        orderId, 
        amount, 
        mpesaReceipt, 
        phoneNumber, 
        items,
        status 
    } = data;
    
    const itemsHTML = items ? items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${item.price.toLocaleString()}</td>
        </tr>
    `).join('') : '';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">KejaYaCapo</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">A CRTV AGNC</p>
            </div>
            
            <div style="padding: 30px 20px;">
                <h2 style="color: #000; margin-top: 0;">Order Confirmation</h2>
                <p>Dear ${customerName},</p>
                <p>Thank you for your order! Your payment has been ${status === 'completed' ? 'successfully processed' : 'received'}.</p>
                
                <div style="background: #f8f8f8; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #000;">Order Details</h3>
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> KES ${amount.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>M-Pesa Receipt:</strong> ${mpesaReceipt}</p>
                    <p style="margin: 5px 0;"><strong>Phone Number:</strong> ${phoneNumber}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${status === 'completed' ? '#28a745' : '#ffc107'}; font-weight: bold;">${status.toUpperCase()}</span></p>
                </div>
                
                ${items ? `
                <h3 style="color: #000;">Items Ordered</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold;">
                            <td colspan="2" style="padding: 15px 10px; text-align: right; border-top: 2px solid #000;">Total:</td>
                            <td style="padding: 15px 10px; text-align: right; border-top: 2px solid #000;">KES ${amount.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
                ` : ''}
                
                <p style="margin-top: 30px;">We'll process your order and notify you once it's ready for delivery.</p>
                <p>If you have any questions, please contact us at <a href="mailto:support@kejayacapo.shop" style="color: #000;">support@kejayacapo.shop</a></p>
            </div>
            
            <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">© ${new Date().getFullYear()} KejaYaCapo. All rights reserved.</p>
                <p style="margin: 10px 0 0 0;">
                    <a href="https://kejayacapo.shop" style="color: #666; text-decoration: none;">Visit our website</a> |
                    <a href="https://kejayacapo.shop/terms.html" style="color: #666; text-decoration: none;">Terms of Service</a>
                </p>
            </div>
        </body>
        </html>
    `;
}

function generateAdminNotificationHTML(data) {
    const { 
        customerName, 
        customerEmail,
        orderId, 
        amount, 
        mpesaReceipt, 
        phoneNumber, 
        items 
    } = data;
    
    const itemsHTML = items ? items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${item.price.toLocaleString()}</td>
        </tr>
    `).join('') : '';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #000; color: #fff; padding: 20px;">
                <h1 style="margin: 0;">🛍️ New Order Received</h1>
            </div>
            
            <div style="padding: 30px 20px;">
                <h2 style="color: #000; margin-top: 0;">Order #${orderId}</h2>
                
                <div style="background: #f8f8f8; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #000;">Customer Information</h3>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${phoneNumber}</p>
                </div>
                
                <div style="background: #e8f5e9; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #000;">Payment Details</h3>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> KES ${amount.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>M-Pesa Receipt:</strong> ${mpesaReceipt}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">PAID</span></p>
                </div>
                
                ${items ? `
                <h3 style="color: #000;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold;">
                            <td colspan="2" style="padding: 15px 10px; text-align: right; border-top: 2px solid #000;">Total:</td>
                            <td style="padding: 15px 10px; text-align: right; border-top: 2px solid #000;">KES ${amount.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
                ` : ''}
                
                <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 3px;">
                    <strong>Action Required:</strong> Please process this order and prepare for delivery/pickup.
                </p>
            </div>
            
            <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">KejaYaCapo Admin Notification</p>
            </div>
        </body>
        </html>
    `;
}

async function sendAdminNotification(data) {
    const resend = getResendClient();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kejayacapo.shop';
    const fromEmail = process.env.FROM_EMAIL || 'orders@kejayacapo.shop';
    
    try {
        const result = await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `New Order #${data.orderId} - KES ${data.amount.toLocaleString()}`,
            html: generateAdminNotificationHTML(data)
        });
        
        return result;
    } catch (error) {
        console.error('Admin email send error:', error);
        throw error;
    }
}

module.exports = {
    sendTransactionEmail,
    sendAdminNotification
};
