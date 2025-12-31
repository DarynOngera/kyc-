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

    const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html: generateTransactionEmailHTML(data)
    });

    return result;
}

async function sendAdminNotification(data) {
    const resend = getResendClient();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kejayacapo.shop';
    const fromEmail = process.env.FROM_EMAIL || 'orders@kejayacapo.shop';

    const result = await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `New Order #${data.orderId} - KES ${data.amount.toLocaleString()}`,
        html: generateAdminNotificationHTML(data)
    });

    return result;
}

async function sendOrderConfirmationEmail(to, data) {
    const resend = getResendClient();
    const fromEmail = process.env.FROM_EMAIL || 'orders@kejayacapo.shop';

    const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject: `Order Confirmation #${data.orderNumber} - KejaYaCapo`,
        html: generateOrderConfirmationHTML(data)
    });

    return result;
}

async function sendEmailVerificationEmail(to, data) {
    const resend = getResendClient();
    const fromEmail = process.env.FROM_EMAIL || 'orders@kejayacapo.shop';

    const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject: 'Verify your email - KejaYaCapo',
        html: generateEmailVerificationHTML(data)
    });

    return result;
}

function generateEmailVerificationHTML(data) {
    const { customerName, verifyUrl } = data;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 300; letter-spacing: 2px;">KEJAYACAPO</h1>
                                    <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">A CRTV AGNC</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px 20px 30px; border-bottom: 2px solid #000000;">
                                    <h2 style="margin: 0; font-size: 24px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">Verify your email</h2>
                                    <p style="margin: 10px 0 0 0; color: #666666; font-size: 14px;">Hi ${customerName || 'there'}, confirm your email to activate your account.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 30px; text-align: center;">
                                    <a href="${verifyUrl}" style="display: inline-block; background: #000000; color: #ffffff; padding: 14px 22px; text-decoration: none; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Verify Email</a>
                                    <p style="margin: 20px 0 0 0; color: #666666; font-size: 13px; line-height: 1.6;">If the button doesn't work, copy and paste this link:</p>
                                    <p style="margin: 8px 0 0 0; font-size: 12px; word-break: break-all;"><a href="${verifyUrl}" style="color: #000000; text-decoration: underline;">${verifyUrl}</a></p>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #000000; padding: 22px 30px; text-align: center;">
                                    <p style="margin: 0; color: #ffffff; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">&copy; ${new Date().getFullYear()} KejaYaCapo</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
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

    const currentDate = new Date().toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemsHTML = items ? items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.name}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: center; font-size: 14px;">${item.quantity}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 14px;">KES ${item.price.toLocaleString()}</td>
        </tr>
    `).join('') : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @media only screen and (max-width: 600px) {
                    .receipt-container {
                        padding: 20px 15px !important;
                    }
                    .receipt-header {
                        font-size: 32px !important;
                    }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
                                    <h1 class="receipt-header" style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 300; letter-spacing: 2px;">KEJAYACAPO</h1>
                                    <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">A CRTV AGNC</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px 20px 30px; border-bottom: 2px solid #000000;">
                                    <h2 style="margin: 0; font-size: 24px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">Payment Receipt</h2>
                                    <p style="margin: 8px 0 0 0; color: #666666; font-size: 14px;">${currentDate}</p>
                                </td>
                            </tr>
                            <tr>
                                <td class="receipt-container" style="padding: 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding-bottom: 20px;">
                                                <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Bill To</p>
                                                <p style="margin: 5px 0 0 0; font-size: 16px; color: #000000; font-weight: 500;">${customerName}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 0 30px 30px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0;">
                                        <tr style="background-color: #fafafa;">
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0;">Receipt Number</td>
                                            <td style="padding: 12px 15px; font-size: 14px; color: #000000; text-align: right; border-bottom: 1px solid #e0e0e0; font-family: 'Courier New', monospace;">${mpesaReceipt}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0;">Order ID</td>
                                            <td style="padding: 12px 15px; font-size: 14px; color: #000000; text-align: right; border-bottom: 1px solid #e0e0e0; font-family: 'Courier New', monospace;">${orderId}</td>
                                        </tr>
                                        <tr style="background-color: #fafafa;">
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0;">Phone Number</td>
                                            <td style="padding: 12px 15px; font-size: 14px; color: #000000; text-align: right; border-bottom: 1px solid #e0e0e0;">${phoneNumber}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Payment Status</td>
                                            <td style="padding: 12px 15px; text-align: right;">
                                                <span style="display: inline-block; padding: 4px 12px; background-color: ${status === 'completed' ? '#000000' : '#666666'}; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${status}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            ${items ? `
                            <tr>
                                <td style="padding: 0 30px 30px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <thead>
                                            <tr style="border-bottom: 2px solid #000000;">
                                                <th style="padding: 12px 0; text-align: left; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Item</th>
                                                <th style="padding: 12px 0; text-align: center; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Qty</th>
                                                <th style="padding: 12px 0; text-align: right; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHTML}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 0 30px 40px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #000000; border-bottom: 2px solid #000000;">
                                        <tr>
                                            <td style="padding: 20px 0; font-size: 18px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Total Paid</td>
                                            <td style="padding: 20px 0; font-size: 24px; font-weight: 600; text-align: right;">KES ${amount.toLocaleString()}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
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

    const currentDate = new Date().toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemsHTML = Array.isArray(items) && items.length
        ? items.map(item => `
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.name}</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; text-align: center; font-size: 14px;">${item.quantity}</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 14px;">KES ${Number(item.price || 0).toLocaleString()}</td>
            </tr>
        `).join('')
        : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @media only screen and (max-width: 600px) {
                    .container {
                        padding: 20px 15px !important;
                    }
                    .header-title {
                        font-size: 28px !important;
                    }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="background-color: #000000; padding: 28px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td>
                                                <h1 class="header-title" style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 500; letter-spacing: 1px;">NEW ORDER</h1>
                                                <p style="margin: 6px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">KEJAYACAPO</p>
                                            </td>
                                            <td align="right" style="vertical-align: top;">
                                                <span style="display: inline-block; padding: 6px 10px; background-color: #ffffff; color: #000000; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Action Required</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td class="container" style="padding: 30px;">
                                    <p style="margin: 0; color: #666666; font-size: 14px;">${currentDate}</p>
                                    <h2 style="margin: 10px 0 0 0; font-size: 18px; font-weight: 600; color: #000000;">Payment Confirmed</h2>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 0 30px 25px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0;">
                                        <tr style="background-color: #fafafa;">
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0;">Order ID</td>
                                            <td style="padding: 12px 15px; font-size: 14px; color: #000000; text-align: right; border-bottom: 1px solid #e0e0e0; font-family: 'Courier New', monospace;">${orderId}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0;">Amount</td>
                                            <td style="padding: 12px 15px; font-size: 16px; color: #000000; text-align: right; border-bottom: 1px solid #e0e0e0; font-weight: 700;">KES ${Number(amount || 0).toLocaleString()}</td>
                                        </tr>
                                        <tr style="background-color: #fafafa;">
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0;">M-Pesa Receipt</td>
                                            <td style="padding: 12px 15px; font-size: 14px; color: #000000; text-align: right; border-bottom: 1px solid #e0e0e0; font-family: 'Courier New', monospace;">${mpesaReceipt || ''}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Customer</td>
                                            <td style="padding: 12px 15px; font-size: 14px; color: #000000; text-align: right;">${customerName || ''}${customerEmail ? ` &lt;${customerEmail}&gt;` : ''}${phoneNumber ? ` • ${phoneNumber}` : ''}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            ${itemsHTML ? `
                            <tr>
                                <td style="padding: 0 30px 30px 30px;">
                                    <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666666;">Items</h3>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <thead>
                                            <tr style="border-bottom: 2px solid #000000;">
                                                <th style="padding: 10px 0; text-align: left; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Item</th>
                                                <th style="padding: 10px 0; text-align: center; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Qty</th>
                                                <th style="padding: 10px 0; text-align: right; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHTML}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            ` : ''}

                            <tr>
                                <td style="background-color: #000000; padding: 22px 30px; text-align: center;">
                                    <p style="margin: 0; color: #ffffff; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">&copy; ${new Date().getFullYear()} KejaYaCapo. Admin Notification.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

function generateOrderConfirmationHTML(data) {
    const {
        customerName,
        orderNumber,
        amount,
        items,
        paymentPending
    } = data;

    const currentDate = new Date().toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemsHTML = Array.isArray(items) && items.length
        ? items.map(item => `
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.name}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: center; font-size: 14px;">${item.quantity}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 14px;">KES ${Number(item.price || 0).toLocaleString()}</td>
            </tr>
        `).join('')
        : '';

    const statusLabel = paymentPending ? 'PENDING' : 'CONFIRMED';
    const statusBg = paymentPending ? '#666666' : '#000000';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @media only screen and (max-width: 600px) {
                    .container {
                        padding: 20px 15px !important;
                    }
                    .brand {
                        font-size: 32px !important;
                    }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
                                    <h1 class="brand" style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 300; letter-spacing: 2px;">KEJAYACAPO</h1>
                                    <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">A CRTV AGNC</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 40px 30px 20px 30px; border-bottom: 2px solid #000000;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td>
                                                <h2 style="margin: 0; font-size: 24px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">Order Confirmation</h2>
                                                <p style="margin: 8px 0 0 0; color: #666666; font-size: 14px;">${currentDate}</p>
                                            </td>
                                            <td align="right" style="vertical-align: top;">
                                                <span style="display: inline-block; padding: 6px 12px; background-color: ${statusBg}; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${statusLabel}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td class="container" style="padding: 30px;">
                                    <p style="margin: 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Customer</p>
                                    <p style="margin: 6px 0 0 0; font-size: 16px; color: #000000; font-weight: 500;">${customerName || 'Customer'}</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 0 30px 30px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0;">
                                        <tr style="background-color: #fafafa;">
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0;">Order Number</td>
                                            <td style="padding: 12px 15px; font-size: 14px; color: #000000; text-align: right; border-bottom: 1px solid #e0e0e0; font-family: 'Courier New', monospace;">${orderNumber}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 15px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Total</td>
                                            <td style="padding: 12px 15px; font-size: 18px; color: #000000; text-align: right; font-weight: 700;">KES ${Number(amount || 0).toLocaleString()}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            ${itemsHTML ? `
                            <tr>
                                <td style="padding: 0 30px 30px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <thead>
                                            <tr style="border-bottom: 2px solid #000000;">
                                                <th style="padding: 12px 0; text-align: left; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Item</th>
                                                <th style="padding: 12px 0; text-align: center; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Qty</th>
                                                <th style="padding: 12px 0; text-align: right; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHTML}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            ` : ''}

                            <tr>
                                <td style="padding: 0 30px 40px 30px; text-align: center;">
                                    <p style="margin: 0; font-size: 14px; color: #000000; line-height: 1.6;">Your order has been received${paymentPending ? ' and is pending payment confirmation' : ''}. We'll notify you once it's ready.</p>
                                    <p style="margin: 20px 0 0 0; font-size: 13px; color: #666666;">Questions? Contact us at <a href="mailto:support@kejayacapo.shop" style="color: #000000; text-decoration: underline;">support@kejayacapo.shop</a></p>
                                </td>
                            </tr>

                            <tr>
                                <td style="background-color: #000000; padding: 30px; text-align: center;">
                                    <p style="margin: 0; color: #ffffff; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">&copy; ${new Date().getFullYear()} KejaYaCapo. All Rights Reserved.</p>
                                    <p style="margin: 15px 0 0 0;">
                                        <a href="https://kejayacapo.shop" style="color: #ffffff; text-decoration: none; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 0 10px;">Website</a>
                                        <span style="color: #666666;">|</span>
                                        <a href="https://instagram.com/kejayacapo" style="color: #ffffff; text-decoration: none; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 0 10px;">Instagram</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

module.exports = {
    sendTransactionEmail,
    sendAdminNotification,
    sendOrderConfirmationEmail,
    sendEmailVerificationEmail,
    generateTransactionEmailHTML,
    generateAdminNotificationHTML,
    generateOrderConfirmationHTML,
    generateEmailVerificationHTML
};
