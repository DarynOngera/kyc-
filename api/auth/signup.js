const { getSupabaseClient } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const { normalizeKenyanPhone } = require('../utils/phone');
const crypto = require('crypto');
const { sendEmailVerificationEmail } = require('../utils/email');

async function signup(req, res) {
    try {
        const { email, password, fullName, phoneNumber } = req.body || {};

        if (!email || !password || !fullName || !phoneNumber) {
            return res.status(400).json({
                error: 'All fields are required',
                required: ['email', 'password', 'fullName', 'phoneNumber']
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const normalizedPhone = normalizeKenyanPhone(phoneNumber);
        if (!normalizedPhone) {
            return res.status(400).json({ error: 'Invalid phone number. Use format: 254XXXXXXXXX or 07XXXXXXXX' });
        }

        const supabase = getSupabaseClient();

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

        const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const verifyUrl = `${appBaseUrl}/api/auth/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(rawToken)}`;

        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                {
                    email: normalizedEmail,
                    password_hash: hashedPassword,
                    full_name: fullName,
                    phone_number: normalizedPhone,
                    created_at: new Date().toISOString(),
                    is_active: false,
                    email_verification_token_hash: tokenHash,
                    email_verification_expires_at: expiresAt
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create user', details: error.message });
        }

        const { password_hash, ...userData } = newUser;

        try {
            await sendEmailVerificationEmail(normalizedEmail, {
                customerName: fullName,
                verifyUrl
            });
        } catch (emailError) {
            console.error('Verification email send error:', emailError);
            return res.status(500).json({
                error: 'Account created but failed to send verification email. Please try again later.'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Account created successfully. Please check your email to verify your account.',
            user: userData,
            verification: { required: true }
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

module.exports = signup;
