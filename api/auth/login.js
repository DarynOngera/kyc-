const { getSupabaseClient } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const supabase = getSupabaseClient();

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            jwtSecret,
            { expiresIn: '7d' }
        );

        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        const { password_hash, ...userData } = user;

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

module.exports = login;
