/**
 * Cart Page JavaScript
 * Handles cart display, updates, and checkout
 */

// ===================================
// Cart State Management
// ===================================
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartDisplay();
}

// ===================================
// Cart Display
// ===================================
function updateCartDisplay() {
    const cart = getCart();
    const cartItemsContainer = document.querySelector('.cart-items');
    const emptyCartMessage = document.querySelector('.empty-cart');
    const cartContent = document.querySelector('.cart-content');

    if (cart.length === 0) {
        // Show empty cart message
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        updateCartSummary(0);
        return;
    }

    // Hide empty cart message
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    if (cartContent) cartContent.style.display = 'grid';

    // Render cart items
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${getProductImage(item.title)}" alt="${item.title}">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.title}</h3>
                    <div class="cart-item-variant">Size: ${item.size}</div>
                    <div class="cart-item-variant">Color: ${item.color}</div>
                    <div class="cart-item-price">${item.price}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="cart-qty-btn" data-action="decrease" data-index="${index}">−</button>
                        <input type="number" value="${item.quantity}" min="1" max="10" data-index="${index}">
                        <button class="cart-qty-btn" data-action="increase" data-index="${index}">+</button>
                    </div>
                    <button class="remove-item-btn" data-index="${index}">Remove</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        attachCartEventListeners();
    }

    // Update summary
    updateCartSummary(calculateTotal(cart));
}

// ===================================
// Get Product Image
// ===================================
function getProductImage(title) {
    // Map product titles to their images
    const imageMap = {
        'KejaYaCapo RALLY': 'assets/products/rally-brown-back.jpg',
        'Wakadinali T-Shirt': 'assets/products/wakadinali-white.jpg',
        'Wangari Maathai': 'assets/products/wangari-neon-green.jpg',
        'Capo Brouwerij': 'assets/products/capo-brouwerij-sand.jpg',
        'Capo Brouwerij Shorts': 'assets/products/capo-shorts-orange.jpg',
        'Morio Anzenza': 'assets/products/morio-black.jpg',
        'Coast Vibes': 'assets/products/coast-vibes-blue.jpg',
        'Mombasa Shorts': 'assets/products/mombasa-aqua.jpg',
        'Kenyan AF': 'assets/products/kenyan-af-white.jpg'
    };

    return imageMap[title] || 'assets/products/placeholder.jpg';
}

// ===================================
// Calculate Total
// ===================================
function calculateTotal(cart) {
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace('$', ''));
        return total + (price * item.quantity);
    }, 0);
}

// ===================================
// Update Cart Summary
// ===================================
function updateCartSummary(total) {
    const subtotalEl = document.querySelector('.subtotal-amount');
    const totalEl = document.querySelector('.total-amount');
    const checkoutBtn = document.querySelector('.checkout-btn');

    if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    
    if (checkoutBtn) {
        checkoutBtn.disabled = total === 0;
    }
}

// ===================================
// Event Listeners
// ===================================
function attachCartEventListeners() {
    // Quantity buttons
    document.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });

    // Quantity input
    document.querySelectorAll('.cart-item-quantity input').forEach(input => {
        input.addEventListener('change', handleQuantityInputChange);
    });

    // Remove buttons
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', handleRemoveItem);
    });
}

function handleQuantityChange(e) {
    const action = e.target.dataset.action;
    const index = parseInt(e.target.dataset.index);
    const cart = getCart();

    if (action === 'increase' && cart[index].quantity < 10) {
        cart[index].quantity += 1;
    } else if (action === 'decrease' && cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    }

    saveCart(cart);
}

function handleQuantityInputChange(e) {
    const index = parseInt(e.target.dataset.index);
    let value = parseInt(e.target.value) || 1;
    
    // Validate
    if (value < 1) value = 1;
    if (value > 10) value = 10;

    const cart = getCart();
    cart[index].quantity = value;
    saveCart(cart);
}

function handleRemoveItem(e) {
    const index = parseInt(e.target.dataset.index);
    const cart = getCart();
    
    // Confirm removal
    if (confirm('Remove this item from your cart?')) {
        cart.splice(index, 1);
        saveCart(cart);
    }
}

// ===================================
// Checkout
// ===================================
function initCheckout() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = getCart();
            
            if (cart.length === 0) {
                alert('Your cart is empty');
                return;
            }

            // In a real application, this would redirect to checkout
            alert('Checkout functionality would be implemented here.\n\nTotal: ' + 
                  document.querySelector('.total-amount').textContent);
            
            // Optional: Clear cart after checkout
            // clearCart();
        });
    }
}

// ===================================
// Initialize
// ===================================
function init() {
    updateCartDisplay();
    initCheckout();
    
    console.log('Cart page initialized');
}

// Run on DOM Content Loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
