// Test JWT extraction
const jwt = require('jsonwebtoken');

// Use the JWT secret from your .env
const JWT_SECRET = '2e37ac02b5bb2615c6524e2b5634e6154a03aa6512ef4a095a2ef25f7325b9bc';

// Create a test token
const testToken = jwt.sign({ userId: 'test-user-123', email: 'test@example.com' }, JWT_SECRET);

console.log('Test Token:', testToken);

// Verify the token
const decoded = jwt.verify(testToken, JWT_SECRET);
console.log('Decoded:', decoded);
