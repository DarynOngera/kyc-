/**
 * Checkout Page with M-Pesa Daraja API Integration
 */

// ===================================
// Configuration
// ===================================
const MPESA_CONFIG = {
    // Netlify Function endpoint
    // For local testing: http://localhost:8888/.netlify/functions/mpesa-payment
    // For production: https://your-site.netlify.app/.netlify/functions/mpesa-payment
    apiEndpoint: window.location.hostname === 'localhost' 
        ? 'http://localhost:8888/.netlify/functions/mpesa-payment'
        : '/.netlify/functions/mpesa-payment'
};

// ===================================
// Utility Functions
// ===================================
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function calculateTotal(cart) {
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace('$', ''));
        return total + (price * item.quantity);
    }, 0);
}

// Convert USD to KES (approximate rate)
function usdToKes(usd) {
    const rate = 130; // Approximate conversion rate
    return Math.round(usd * rate);
}

// ===================================
// Display Order Summary
// ===================================
function displayOrderSummary() {
    const cart = getCart();
    const orderItemsContainer = document.getElementById('order-items');
    const totalAmountEl = document.getElementById('total-amount');

    if (cart.length === 0) {
        window.location.href = '/cart.html';
        return;
    }

    // Display items
    orderItemsContainer.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.title} (${item.size}, ${item.color}) x${item.quantity}</span>
            <span>${item.price}</span>
        </div>
    `).join('');

    // Calculate and display total
    const totalUSD = calculateTotal(cart);
    const totalKES = usdToKes(totalUSD);
    
    totalAmountEl.textContent = `KES ${totalKES.toLocaleString()}`;
    totalAmountEl.dataset.amount = totalKES;
}

// ===================================
// M-Pesa STK Push (via Backend)
// ===================================
async function initiateMpesaPayment(phoneNumber, amount, accountReference) {
    try {
        // Get auth token
        const token = localStorage.getItem('authToken');
        
        // Call backend API instead of M-Pesa directly
        const response = await fetch(MPESA_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                phoneNumber,
                amount,
                accountReference: accountReference || 'KejaYaCapo'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('=== SERVER ERROR DETAILS ===');
            console.error('Status:', response.status);
            console.error('Error object:', error);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('===========================');
            throw new Error(error.message || error.error || 'Payment request failed');
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('M-Pesa Payment Error:', error);
        throw error;
    }
}

// ===================================
// Form Handling
// ===================================
function showStatus(message, type) {
    const statusEl = document.getElementById('payment-status');
    statusEl.textContent = message;
    statusEl.className = `payment-status ${type}`;
}

function hideStatus() {
    const statusEl = document.getElementById('payment-status');
    statusEl.className = 'payment-status';
}

async function handleCheckout(event) {
    event.preventDefault();

    const phoneInput = document.getElementById('phone');
    const accountRefInput = document.getElementById('account-ref');
    const payBtn = document.getElementById('pay-btn');
    const totalAmountEl = document.getElementById('total-amount');

    const phoneNumber = phoneInput.value.trim();
    const accountRef = accountRefInput.value.trim() || 'KejaYaCapo';
    const amount = parseInt(totalAmountEl.dataset.amount);

    // Validate phone number
    if (!phoneNumber.match(/^254[0-9]{9}$/)) {
        showStatus('Please enter a valid phone number (254XXXXXXXXX)', 'error');
        return;
    }

    // Disable button and show loading
    payBtn.disabled = true;
    showStatus('Initiating payment... Please check your phone for M-Pesa prompt.', 'loading');

    try {
        const result = await initiateMpesaPayment(phoneNumber, amount, accountRef);

        console.log('M-Pesa Response:', result);

        if (result.ResponseCode === '0') {
            // Success - STK Push sent
            const checkoutRequestId = result.CheckoutRequestID;
            
            showStatus(
                `Payment request sent! Please enter your M-Pesa PIN on your phone (${phoneNumber}) to complete the payment.`,
                'success'
            );

            // Start polling for payment status
            setTimeout(() => {
                showStatus('Waiting for payment confirmation... This may take a few moments.', 'loading');
                pollPaymentStatus(checkoutRequestId, 0);
            }, 3000);

        } else {
            // Error response
            showStatus(
                `Payment failed: ${result.ResponseDescription || 'Unknown error'}`,
                'error'
            );
            payBtn.disabled = false;
        }

    } catch (error) {
        console.error('Payment error:', error);
        
        // Show detailed error message
        const errorMsg = error.message || 'Payment failed. Please try again or contact support.';
        showStatus(errorMsg, 'error');
        
        payBtn.disabled = false;
    }
}

// ===================================
// Payment Status Polling
// ===================================
async function pollPaymentStatus(checkoutRequestId, attemptCount) {
    const MAX_ATTEMPTS = 40; // 40 attempts x 3 seconds = 2 minutes
    const POLL_INTERVAL = 3000; // 3 seconds
    
    if (attemptCount >= MAX_ATTEMPTS) {
        showStatus(
            'Payment verification timeout. Please check your M-Pesa messages or contact support.',
            'error'
        );
        document.getElementById('pay-btn').disabled = false;
        return;
    }
    
    try {
        const response = await fetch(
            `/.netlify/functions/transaction-status?checkoutRequestId=${checkoutRequestId}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to check payment status');
        }
        
        const data = await response.json();
        console.log('Payment status:', data);
        
        if (data.status === 'completed') {
            // Payment successful!
            showStatus('✅ Payment successful! Creating your order...', 'success');
            
            // Create order
            await createOrder(data);
            
        } else if (data.status === 'failed') {
            // Payment failed
            showStatus(
                `❌ Payment failed: ${data.resultDesc || 'Transaction was not completed'}`,
                'error'
            );
            document.getElementById('pay-btn').disabled = false;
            
        } else {
            // Still pending, poll again
            setTimeout(() => {
                pollPaymentStatus(checkoutRequestId, attemptCount + 1);
            }, POLL_INTERVAL);
        }
        
    } catch (error) {
        console.error('Status check error:', error);
        
        // Retry on error
        setTimeout(() => {
            pollPaymentStatus(checkoutRequestId, attemptCount + 1);
        }, POLL_INTERVAL);
    }
}

// ===================================
// Create Order After Payment
// ===================================
async function createOrder(transactionData) {
    try {
        const userData = getUserData();
        const cart = getCart();
        
        if (!userData || !cart || cart.length === 0) {
            throw new Error('Missing user data or cart items');
        }
        
        // Create order with transaction data
        const response = await fetch('/.netlify/functions/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactionId: transactionData.transactionId,
                userId: userData.id,
                cartItems: cart
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create order');
        }
        
        const orderData = await response.json();
        console.log('Order created:', orderData);
        
        // Clear local cart
        localStorage.removeItem('cart');
        
        // Redirect to confirmation page with order details
        const orderInfo = encodeURIComponent(JSON.stringify({
            orderNumber: orderData.order.orderNumber,
            amount: orderData.order.totalAmount,
            mpesaReceipt: orderData.order.mpesaReceipt
        }));
        
        window.location.href = `/order-confirmation.html?order=${orderInfo}`;
        
    } catch (error) {
        console.error('Order creation error:', error);
        showStatus(
            'Payment successful but order creation failed. Please contact support with your M-Pesa receipt.',
            'error'
        );
    }
}

// ===================================
// Authentication Check
// ===================================
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        // User is not logged in, save current page and redirect to login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function prefillUserData() {
    const user = getUserData();
    if (user && user.phone_number) {
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.value = user.phone_number;
        }
        
        const accountRefInput = document.getElementById('account-ref');
        if (accountRefInput && user.full_name) {
            accountRefInput.value = user.full_name;
        }
    }
}

// ===================================
// Initialize
// ===================================
function init() {
    // Check if user is authenticated before proceeding
    if (!checkAuthentication()) {
        return; // Stop initialization if not authenticated
    }
    
    displayOrderSummary();
    prefillUserData(); // Pre-fill form with user data

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }

    console.log('Checkout page initialized');
}

// Run on DOM Content Loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
