const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE email = $1 LIMIT 1',
            [normalizedEmail]
        );

        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        if (user.is_active === false) {
            return res.status(403).json({
                error: 'Email not verified. Please check your inbox for the verification link.'
            });
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

        await db.query(
            'UPDATE users SET last_login = $1 WHERE id = $2',
            [new Date().toISOString(), user.id]
        );

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
