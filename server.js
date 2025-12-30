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
app.use(express.static(__dirname)); // Serve static files

// Import API handlers (native Express)
const authLogin = require('./api/auth/login');
const authSignup = require('./api/auth/signup');
const mpesaPayment = require('./api/mpesa/payment');
const mpesaCallback = require('./api/mpesa/callback');
const createOrder = require('./api/orders/create');
const transactionStatus = require('./api/transactions/status');

// API Routes
app.post('/api/auth/login', authLogin);
app.post('/api/auth/signup', authSignup);
app.post('/api/mpesa/payment', mpesaPayment);
app.post('/api/mpesa/callback', mpesaCallback);
app.post('/api/orders/create', createOrder);
app.get('/api/transactions/status', transactionStatus);

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

// Serve frontend
app.get('*', (req, res) => {
    if (req.path.endsWith('.html') || req.path === '/') {
        res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
    } else {
        res.sendFile(path.join(__dirname, req.path));
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 M-Pesa Environment: ${process.env.MPESA_ENVIRONMENT || 'sandbox'}`);
    console.log(`🔗 Static IP: Check AWS Console for Elastic IP`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});