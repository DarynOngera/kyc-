// Test payment with authentication
const jwt = require('jsonwebtoken');

// Use the JWT secret from your .env
const JWT_SECRET = '2e37ac02b5bb2615c6524e2b5634e6154a03aa6512ef4a095a2ef25f7325b9bc';

// Create a test token (mimicking what login would return)
const testToken = jwt.sign({
  userId: 'b12987c7-888a-4897-b6a6-f07db7246257', // Test user ID
  email: 'test@example.com'
}, JWT_SECRET);

console.log('Auth Token:', testToken);

// Now test the payment endpoint with this token
const { spawn } = require('child_process');

const curl = spawn('curl', [
  '-X', 'POST',
  'http://localhost:3000/api/mpesa/payment',
  '-H', 'Content-Type: application/json',
  '-H', `Authorization: Bearer ${testToken}`,
  '-d', JSON.stringify({
    phoneNumber: '254757238817',
    amount: 100,
    accountReference: 'auth-test'
  })
]);

curl.stdout.on('data', (data) => {
  console.log('Payment Response:', data.toString());
});

curl.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

curl.on('close', (code) => {
  console.log(`Curl exited with code ${code}`);
});
