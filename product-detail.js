/**
 * Product Detail Page JavaScript
 * Handles image gallery, variant selection, and add to cart
 */

// ===================================
// Image Gallery
// ===================================
function initProductGallery() {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.gallery-nav.prev');
    const nextBtn = document.querySelector('.gallery-nav.next');
    
    let currentIndex = 0;
    const images = Array.from(thumbnails).map(t => t.dataset.image);

    function updateImage(index) {
        if (index < 0) index = images.length - 1;
        if (index >= images.length) index = 0;
        
        currentIndex = index;
        mainImage.src = images[index];
        
        // Update active thumbnail
        thumbnails.forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
    }

    // Thumbnail clicks
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            updateImage(index);
        });
    });

    // Navigation arrows
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            updateImage(currentIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            updateImage(currentIndex + 1);
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            updateImage(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            updateImage(currentIndex + 1);
        }
    });
}

// ===================================
// Quantity Selector
// ===================================
function initQuantitySelector() {
    const quantityInput = document.getElementById('quantity');
    const qtyButtons = document.querySelectorAll('.qty-btn');

    qtyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            let currentValue = parseInt(quantityInput.value) || 1;
            const min = parseInt(quantityInput.min) || 1;
            const max = parseInt(quantityInput.max) || 10;

            if (action === 'increase' && currentValue < max) {
                quantityInput.value = currentValue + 1;
            } else if (action === 'decrease' && currentValue > min) {
                quantityInput.value = currentValue - 1;
            }
        });
    });

    // Validate input
    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value) || 1;
        const min = parseInt(quantityInput.min) || 1;
        const max = parseInt(quantityInput.max) || 10;

        if (value < min) value = min;
        if (value > max) value = max;

        quantityInput.value = value;
    });
}

// ===================================
// Add to Cart
// ===================================
function initAddToCart() {
    const form = document.querySelector('.product-form');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const size = formData.get('size');
        const color = formData.get('color');
        const quantity = formData.get('quantity');

        // Validate selections
        if (!size || !color) {
            alert('Please select size and color');
            return;
        }

        // Get product info
        const productTitle = document.querySelector('.product-detail-title').textContent;
        const productPrice = document.querySelector('.price-value').textContent;

        // Create cart item
        const cartItem = {
            title: productTitle,
            price: productPrice,
            size: size,
            color: color,
            quantity: parseInt(quantity)
        };

        // Add to cart (localStorage)
        addToCartStorage(cartItem);

        // Visual feedback
        addToCartBtn.textContent = 'Added to Cart!';
        addToCartBtn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            addToCartBtn.textContent = 'Add to Cart';
            addToCartBtn.style.backgroundColor = '';
        }, 2000);

        // Update cart count
        updateCartCount();
    });
}

function addToCartStorage(item) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if item already exists
    const existingIndex = cart.findIndex(
        cartItem => cartItem.title === item.title && 
                    cartItem.size === item.size && 
                    cartItem.color === item.color
    );

    if (existingIndex > -1) {
        // Update quantity
        cart[existingIndex].quantity += item.quantity;
    } else {
        // Add new item
        cart.push(item);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = totalItems;
        if (totalItems === 0) {
            el.style.display = 'none';
        } else {
            el.style.display = 'flex';
        }
    });
}

// ===================================
// Variant Selection
// ===================================
function initVariantSelection() {
    const sizeSelect = document.getElementById('size');
    const colorSelect = document.getElementById('color');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');

    function checkFormValidity() {
        const isValid = sizeSelect.value && colorSelect.value;
        addToCartBtn.disabled = !isValid;
    }

    sizeSelect.addEventListener('change', checkFormValidity);
    colorSelect.addEventListener('change', checkFormValidity);

    // Initial check
    checkFormValidity();
}

// ===================================
// Initialize All Functions
// ===================================
function init() {
    initProductGallery();
    initQuantitySelector();
    initAddToCart();
    initVariantSelection();
    updateCartCount();
    
    console.log('Product detail page initialized');
}

// Run on DOM Content Loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
