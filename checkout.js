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
        // Call backend API instead of M-Pesa directly
        const response = await fetch(MPESA_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber,
                amount,
                accountReference: accountReference || 'KejaYaCapo'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Payment request failed');
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
            showStatus(
                `Payment request sent! Please enter your M-Pesa PIN on your phone (${phoneNumber}) to complete the payment.`,
                'success'
            );

            // In production, you would:
            // 1. Poll your backend for payment confirmation
            // 2. Clear cart after successful payment
            // 3. Redirect to order confirmation page
            
            setTimeout(() => {
                showStatus(
                    'Waiting for payment confirmation... This may take a few moments.',
                    'loading'
                );
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
        showStatus(
            'Payment failed. Please try again or contact support.',
            'error'
        );
        payBtn.disabled = false;
    }
}

// ===================================
// Initialize
// ===================================
function init() {
    displayOrderSummary();

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
