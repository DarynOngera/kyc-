const { getSupabaseClient } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const { normalizeKenyanPhone } = require('../utils/phone');

async function signup(req, res) {
    try {
        const { email, password, fullName, phoneNumber } = req.body || {};

        if (!email || !password || !fullName || !phoneNumber) {
            return res.status(400).json({
                error: 'All fields are required',
                required: ['email', 'password', 'fullName', 'phoneNumber']
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
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
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                {
                    email: email.toLowerCase(),
                    password_hash: hashedPassword,
                    full_name: fullName,
                    phone_number: normalizedPhone,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create user', details: error.message });
        }

        const { password_hash, ...userData } = newUser;

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: userData
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
