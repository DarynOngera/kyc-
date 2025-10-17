#!/usr/bin/env node
// Test email sending with Resend

require('dotenv').config();
const { Resend } = require('resend');

async function testEmail() {
    console.log('🧪 Testing Resend Email Configuration\n');
    console.log('================================\n');
    
    // Check environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    console.log('📋 Configuration Check:');
    console.log('   RESEND_API_KEY:', apiKey ? `Set (${apiKey.substring(0, 10)}...)` : '❌ NOT SET');
    console.log('   FROM_EMAIL:', fromEmail || '❌ NOT SET');
    console.log('   ADMIN_EMAIL:', adminEmail || '❌ NOT SET');
    console.log('');
    
    if (!apiKey) {
        console.error('❌ RESEND_API_KEY is not set in .env file');
        process.exit(1);
    }
    
    if (!fromEmail) {
        console.error('❌ FROM_EMAIL is not set in .env file');
        process.exit(1);
    }
    
    try {
        const resend = new Resend(apiKey);
        
        console.log('📧 Sending test email...');
        console.log('   From:', fromEmail);
        console.log('   To:', adminEmail || 'test@example.com');
        console.log('');
        
        const result = await resend.emails.send({
            from: fromEmail,
            to: adminEmail || 'test@example.com',
            subject: 'Test Email - KejaYaCapo',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">KEJAYACAPO</h1>
                            <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 2px;">A CRTV AGNC</p>
                        </div>
                        <div style="padding: 30px; background: #f5f5f5;">
                            <h2>✅ Email Test Successful!</h2>
                            <p>This is a test email from your KejaYaCapo e-commerce system.</p>
                            <p><strong>Configuration:</strong></p>
                            <ul>
                                <li>From: ${fromEmail}</li>
                                <li>API Key: ${apiKey.substring(0, 10)}...</li>
                                <li>Timestamp: ${new Date().toISOString()}</li>
                            </ul>
                            <p>If you received this email, your Resend integration is working correctly! 🎉</p>
                        </div>
                        <div style="background: #000; color: #fff; padding: 15px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">KejaYaCapo Email Test</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        
        console.log('✅ Email sent successfully!');
        console.log('');
        console.log('📊 Result:');
        console.log(JSON.stringify(result, null, 2));
        console.log('');
        console.log('================================');
        console.log('✅ Resend is configured correctly!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Check your inbox at:', adminEmail || 'test@example.com');
        console.log('2. Check spam folder if not in inbox');
        console.log('3. Verify domain in Resend dashboard if emails not arriving');
        console.log('');
        
    } catch (error) {
        console.error('❌ Email send failed!');
        console.error('');
        console.error('Error details:');
        console.error('   Message:', error.message);
        console.error('   Name:', error.name);
        
        if (error.response) {
            console.error('   Response:', error.response);
        }
        
        console.error('');
        console.error('Common issues:');
        console.error('   1. Invalid API key - Check Resend dashboard');
        console.error('   2. Domain not verified - Add DNS records in Resend');
        console.error('   3. FROM_EMAIL domain must match verified domain');
        console.error('   4. Rate limit exceeded - Wait a few minutes');
        console.error('');
        
        process.exit(1);
    }
}

testEmail();
