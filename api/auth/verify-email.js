const crypto = require('crypto');
const { getSupabaseClient } = require('../utils/supabase');

async function verifyEmail(req, res) {
    try {
        const { email, token } = req.query || {};

        const acceptHeader = String(req.headers.accept || '');
        const wantsHtml = acceptHeader.includes('text/html');

        function redirectToLogin(status, message) {
            const location = `/login.html?verified=${encodeURIComponent(status)}${message ? `&message=${encodeURIComponent(message)}` : ''}`;
            return res.redirect(302, location);
        }

        // Validate required parameters
        if (!email || !token) {
            if (wantsHtml) return redirectToLogin('missing', 'Missing email or token');
            return res.status(400).json({ error: 'Missing email or token' });
        }

        // Sanitize inputs
        const normalizedEmail = String(email).trim().toLowerCase();
        const sanitizedToken = String(token).trim();
        
        // Basic validation
        if (normalizedEmail.length > 255 || sanitizedToken.length !== 64) {
            if (wantsHtml) return redirectToLogin('invalid', 'Invalid verification parameters');
            return res.status(400).json({ error: 'Invalid verification parameters' });
        }

        const tokenHash = crypto.createHash('sha256').update(sanitizedToken).digest('hex');

        const supabase = getSupabaseClient();

        // Fetch user with all necessary fields
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email_verification_expires_at, email_verification_token_hash, is_active, email_verified_at')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (error) {
            console.error('Supabase error:', error);
            if (wantsHtml) return redirectToLogin('error', 'Failed to verify email');
            return res.status(500).json({ error: 'Failed to verify email' });
        }

        // User not found
        if (!user) {
            if (wantsHtml) return redirectToLogin('invalid', 'User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // IMPROVEMENT: Check if already verified (idempotent operation)
        if (user.is_active && user.email_verified_at) {
            if (wantsHtml) return redirectToLogin('already', 'Email already verified');
            return res.status(200).json({ 
                success: true, 
                message: 'Email already verified. You can log in.',
                alreadyVerified: true
            });
        }

        // No verification token exists
        if (!user.email_verification_token_hash) {
            if (wantsHtml) return redirectToLogin('invalid', 'Verification link is invalid or has been used');
            return res.status(400).json({ error: 'Verification link is invalid or has been used' });
        }

        // Check token expiration BEFORE comparing hashes (optimization)
        if (user.email_verification_expires_at) {
            const expiresAt = new Date(user.email_verification_expires_at);
            if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
                if (wantsHtml) return redirectToLogin('expired', 'Verification link has expired');
                return res.status(400).json({ 
                    error: 'Verification link has expired',
                    canResend: true
                });
            }
        }

        // Verify token hash using timing-safe comparison
        const expectedHash = Buffer.from(user.email_verification_token_hash, 'hex');
        const providedHash = Buffer.from(tokenHash, 'hex');
        
        if (expectedHash.length !== providedHash.length || 
            !crypto.timingSafeEqual(expectedHash, providedHash)) {
            if (wantsHtml) return redirectToLogin('invalid', 'Invalid verification token');
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        // Update user - set verified status and clear token
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_active: true,
                email_verified_at: new Date().toISOString(),
                email_verification_token_hash: null,
                email_verification_expires_at: null
            })
            .eq('id', user.id)
            // IMPROVEMENT: Only update if not already active (prevents race conditions)
            .eq('is_active', false);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            // Check if it was already verified in a race condition
            const { data: recheckUser } = await supabase
                .from('users')
                .select('is_active')
                .eq('id', user.id)
                .single();
            
            if (recheckUser && recheckUser.is_active) {
                if (wantsHtml) return redirectToLogin('success', 'Email verified successfully');
                return res.status(200).json({ 
                    success: true, 
                    message: 'Email verified successfully. You can now log in.' 
                });
            }
            
            if (wantsHtml) return redirectToLogin('error', 'Failed to complete verification');
            return res.status(500).json({ error: 'Failed to complete verification' });
        }

        // Success response
        if (wantsHtml) return redirectToLogin('success');

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (err) {
        console.error('Verify email error:', err);
        const acceptHeader = String(req.headers.accept || '');
        if (acceptHeader.includes('text/html')) {
            return res.redirect(302, `/login.html?verified=error&message=${encodeURIComponent('Internal server error')}`);
        }
        return res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

module.exports = verifyEmail;