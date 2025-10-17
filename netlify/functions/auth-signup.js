// User Signup Function
const { getSupabaseClient } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        const { email, password, fullName, phoneNumber } = JSON.parse(event.body);
        
        // Validate input
        if (!email || !password || !fullName || !phoneNumber) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'All fields are required',
                    required: ['email', 'password', 'fullName', 'phoneNumber']
                })
            };
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid email format' })
            };
        }
        
        // Validate password strength (min 8 characters)
        if (password.length < 8) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Password must be at least 8 characters' })
            };
        }
        
        // Validate phone number (Kenyan format)
        const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
        if (!phoneRegex.test(phoneNumber)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid phone number. Use format: 254XXXXXXXXX or 07XXXXXXXX' })
            };
        }
        
        const supabase = getSupabaseClient();
        
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();
        
        if (existingUser) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ error: 'Email already registered' })
            };
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Normalize phone number to 254 format
        const normalizedPhone = phoneNumber.replace(/^(?:\+?254|0)/, '254');
        
        // Create user
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
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to create user', details: error.message })
            };
        }
        
        // Return user data (without password)
        const { password_hash, ...userData } = newUser;
        
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Account created successfully',
                user: userData
            })
        };
        
    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};
