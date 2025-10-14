/**
 * Duka Page - Custom JavaScript
 * Clean, vanilla JS implementation for product page interactions
 */

// ===================================
// Mobile Category Dropdown Navigation
// ===================================
function initCategoryDropdown() {
    const categorySelect = document.getElementById('category-select');
    
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue) {
                window.location.href = selectedValue;
            }
        });
    }
}

// ===================================
// Lazy Loading Images
// ===================================
function initLazyLoading() {
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Load the image
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    
                    // Stop observing this image
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Observe all images with data-src attribute
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

// ===================================
// Scrolling Text Animation Enhancement
// ===================================
function initScrollingText() {
    const scrollingTextInner = document.querySelector('.scrolling-text-inner');
    
    if (scrollingTextInner) {
        // Clone the content to create seamless loop
        const content = scrollingTextInner.innerHTML;
        scrollingTextInner.innerHTML = content + content;
    }
}

// ===================================
// Product Grid Animation on Scroll
// ===================================
function initProductAnimation() {
    if ('IntersectionObserver' in window) {
        const productObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach((item, index) => {
            // Set initial state
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            
            // Observe the item
            productObserver.observe(item);
        });
    }
}
// ===================================
// Category Filtering
// ===================================
function initCategoryFilter() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const productItems = document.querySelectorAll('.product-item');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter products
            productItems.forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

// ===================================
// Cart Functionality (Basic)
// ===================================
function initCart() {
    // Get cart count from localStorage or initialize to 0
    const cartCount = localStorage.getItem('cartCount') || 0;
    updateCartCount(cartCount);
}

function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = count;
        if (count === 0) {
            el.style.display = 'none';
        } else {
            el.style.display = 'flex';
        }
    });
}

// ===================================
// Smooth Scroll for Anchor Links
// ===================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only prevent default if it's not just '#'
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// ===================================
// Header Scroll Effect
// ===================================
function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add shadow on scroll
        if (currentScroll > 10) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
}

// ===================================
// Product Image Hover Effect Enhancement
// ===================================
function initProductImageHover() {
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        const mainImage = item.querySelector('.product-image--main');
        const hoverImage = item.querySelector('.product-image--hover');
        
        if (mainImage && hoverImage) {
            // Preload hover image
            const img = new Image();
            img.src = hoverImage.src;
        }
    });
}

// ===================================
// Keyboard Navigation Enhancement
// ===================================
function initKeyboardNav() {
    // Add keyboard support for product grid
    const productLinks = document.querySelectorAll('.product-link');
    
    productLinks.forEach(link => {
        link.addEventListener('keydown', (e) => {
            // Add visual feedback on Enter/Space
            if (e.key === 'Enter' || e.key === ' ') {
                link.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    link.style.transform = 'scale(1)';
                }, 100);
            }
        });
    });
}

// ===================================
// Performance Monitoring (Optional)
// ===================================
function logPerformance() {
    if ('performance' in window && 'PerformanceObserver' in window) {
        // Log page load time
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
        });
    }
}

// ===================================
// Error Handling for Images
// ===================================
function initImageErrorHandling() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            // Replace with placeholder or hide
            this.style.backgroundColor = '#f0f0f0';
            this.alt = 'Image not available';
            console.warn('Failed to load image:', this.src);
        });
    });
}

// ===================================
// Initialize All Functions
// ===================================
function init() {
    // Core functionality
    initCategoryDropdown();
    initCategoryFilter();
    initScrollingText();
    initCart();
    
    // Visual enhancements
    initProductAnimation();
    initHeaderScroll();
    initProductImageHover();
    
    // Accessibility & UX
    initSmoothScroll();
    initKeyboardNav();
    
    // Performance & Error Handling
    initLazyLoading();
    initImageErrorHandling();
    
    // Optional: Performance logging (remove in production)
    // logPerformance();
    
    console.log('Duka page initialized successfully');
}

// ===================================
// Run on DOM Content Loaded
// ===================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded
    init();
}

// ===================================
// Export functions for potential use in other scripts
// ===================================
window.DukaPage = {
    updateCartCount,
    init
};
