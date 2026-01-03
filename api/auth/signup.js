const { getSupabaseClient } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const { normalizeKenyanPhone } = require('../utils/phone');
const crypto = require('crypto');
const { sendEmailVerificationEmail } = require('../utils/email');

async function signup(req, res) {
    try {
        const { email, password, fullName, phoneNumber } = req.body || {};

        // Validation: Required fields
        if (!email || !password || !fullName || !phoneNumber) {
            return res.status(400).json({
                error: 'All fields are required',
                required: ['email', 'password', 'fullName', 'phoneNumber']
            });
        }

        // Sanitize and normalize email
        const normalizedEmail = String(email).trim().toLowerCase();

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // OPTIONAL: Remove or comment out Gmail-only restriction to be less restrictive
        // if (!normalizedEmail.endsWith('@gmail.com')) {
        //     return res.status(400).json({ error: 'Only Gmail addresses are allowed' });
        // }

        // Password validation
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Phone number validation
        const normalizedPhone = normalizeKenyanPhone(phoneNumber);
        if (!normalizedPhone) {
            return res.status(400).json({ 
                error: 'Invalid phone number. Use format: 254XXXXXXXXX or 07XXXXXXXX' 
            });
        }

        // Sanitize full name - prevent excessive whitespace and trim
        const sanitizedFullName = String(fullName).trim().replace(/\s+/g, ' ');
        if (!sanitizedFullName || sanitizedFullName.length < 2) {
            return res.status(400).json({ error: 'Invalid full name' });
        }

        const supabase = getSupabaseClient();

        // Check for existing user - include phone number check for better UX
        const { data: existingUsers } = await supabase
            .from('users')
            .select('id, email, phone_number')
            .or(`email.eq.${normalizedEmail},phone_number.eq.${normalizedPhone}`)
            .limit(1);

        if (existingUsers && existingUsers.length > 0) {
            const existing = existingUsers[0];
            if (existing.email === normalizedEmail) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            if (existing.phone_number === normalizedPhone) {
                return res.status(409).json({ error: 'Phone number already registered' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token with increased security
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        // Extended expiration time - 24 hours instead of 1 hour for less restrictive UX
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

        const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const verifyUrl = `${appBaseUrl}/api/auth/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(rawToken)}`;

        // Create user with verification token
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                {
                    email: normalizedEmail,
                    password_hash: hashedPassword,
                    full_name: sanitizedFullName,
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
            // Provide more specific error for duplicate entries
            if (error.code === '23505') {
                return res.status(409).json({ error: 'User already exists' });
            }
            return res.status(500).json({ 
                error: 'Failed to create user', 
                details: error.message 
            });
        }

        // Remove sensitive data from response
        const { password_hash, email_verification_token_hash, ...userData } = newUser;

        // Send verification email - non-blocking with better error handling
        let emailSent = false;
        try {
            await sendEmailVerificationEmail(normalizedEmail, {
                customerName: sanitizedFullName,
                verifyUrl
            });
            emailSent = true;
        } catch (emailError) {
            console.error('Verification email send error:', emailError);
            // Don't fail signup if email fails - allow resend functionality
        }

        return res.status(201).json({
            success: true,
            message: emailSent 
                ? 'Account created successfully. Please check your email to verify your account.'
                : 'Account created successfully. Verification email will be sent shortly.',
            user: userData,
            verification: { 
                required: true,
                emailSent,
                expiresInHours: 24
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = signup;