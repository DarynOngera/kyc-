/**
 * Express Server for EC2 - KejaYaCapo
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static assets (keep HTML out of public root)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/products', express.static(path.join(__dirname, 'products')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));
app.use(express.static(__dirname, { extensions: [] }));

// Import API handlers (native Express)
const authLogin = require('./api/auth/login');
const authSignup = require('./api/auth/signup');
const authVerifyEmail = require('./api/auth/verify-email');
const mpesaPayment = require('./api/mpesa/payment');
const mpesaCallback = require('./api/mpesa/callback');
const createOrder = require('./api/orders/create');
const transactionStatus = require('./api/transactions/status');
const bankCreditIpn = require('./api/ipn/bank-credit');

// API Routes
app.post('/api/auth/login', authLogin);
app.post('/api/auth/signup', authSignup);
app.get('/api/auth/verify-email', authVerifyEmail);
app.post('/api/mpesa/payment', mpesaPayment);
app.post('/api/mpesa/callback', mpesaCallback);
app.post('/api/orders/create', createOrder);
app.get('/api/transactions/status', transactionStatus);
app.post('/api/ipn/bank/credit', bankCreditIpn);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
    });
});

// API 404
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Internal-only test page (guarded by INTERNAL_TEST_TOKEN)
app.get('/__internal/pay', (req, res) => {
    const token = process.env.INTERNAL_TEST_TOKEN;
    if (!token) return res.status(404).send('Not found');

    const provided = String(req.query?.t || '');
    if (!provided || provided !== token) return res.status(404).send('Not found');

    return res.sendFile(path.join(__dirname, 'internal-test-payment.html'));
});

function sendView(res, relativePath) {
    return res.sendFile(path.join(__dirname, 'views', relativePath));
}

// Block direct .html access (force pretty URLs)
app.get(/.*\.html$/, (req, res) => {
    return res.status(404).send('Not found');
});

// Pretty URL routes
app.get('/', (req, res) => sendView(res, 'index.html'));
app.get('/index', (req, res) => sendView(res, 'index.html'));
app.get('/duka', (req, res) => sendView(res, 'duka.html'));
app.get('/cart', (req, res) => sendView(res, 'cart.html'));
app.get('/checkout', (req, res) => sendView(res, 'checkout.html'));
app.get('/login', (req, res) => sendView(res, 'login.html'));
app.get('/signup', (req, res) => sendView(res, 'signup.html'));
app.get('/about', (req, res) => sendView(res, 'about.html'));
app.get('/terms', (req, res) => sendView(res, 'terms.html'));
app.get('/order-confirmation', (req, res) => sendView(res, 'order-confirmation.html'));

// Product pages
app.get('/products/:slug', (req, res) => {
    return sendView(res, path.join('products', `${req.params.slug}.html`));
});

// Frontend 404
app.use((req, res) => {
    res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`M-Pesa Environment: ${process.env.MPESA_ENVIRONMENT || 'sandbox'}`);
    console.log(`Static IP: Check AWS Console for Elastic IP`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});