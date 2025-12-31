const crypto = require('crypto');
const { getSupabaseClient } = require('../utils/supabase');

async function verifyEmail(req, res) {
    try {
        const { email, token } = req.query || {};

        if (!email || !token) {
            return res.status(400).json({ error: 'Missing email or token' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

        const supabase = getSupabaseClient();

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email_verification_expires_at, email_verification_token_hash, is_active')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to verify email' });
        }

        if (!user || !user.email_verification_token_hash) {
            return res.status(400).json({ error: 'Invalid or expired verification link' });
        }

        if (user.email_verification_token_hash !== tokenHash) {
            return res.status(400).json({ error: 'Invalid or expired verification link' });
        }

        if (user.email_verification_expires_at) {
            const expiresAt = new Date(user.email_verification_expires_at);
            if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
                return res.status(400).json({ error: 'Invalid or expired verification link' });
            }
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_active: true,
                email_verified_at: new Date().toISOString(),
                email_verification_token_hash: null,
                email_verification_expires_at: null
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Supabase error:', updateError);
            return res.status(500).json({ error: 'Failed to verify email' });
        }

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (err) {
        console.error('Verify email error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = verifyEmail;
