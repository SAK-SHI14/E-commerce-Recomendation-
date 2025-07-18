// console.clear();

let contentTitle;

console.log(document.cookie);

// Global variables
let products = []; // Store products globally

function dynamicClothingSection(ob) {
  let boxDiv = document.createElement("div");
  boxDiv.id = "box";

  let boxLink = document.createElement("a");
  boxLink.href = "/contentDetails.html?id=" + ob.id;

  let imgTag = document.createElement("img");
  imgTag.src = ob.preview;

  let detailsDiv = document.createElement("div");
  detailsDiv.id = "details";

  let h3 = document.createElement("h3");
  h3.appendChild(document.createTextNode(ob.name));

  let h4 = document.createElement("h4");
  h4.appendChild(document.createTextNode(ob.brand));

  let h2 = document.createElement("h2");
  h2.appendChild(document.createTextNode("Rs " + ob.price));

  boxDiv.appendChild(boxLink);
  boxLink.appendChild(imgTag);
  boxLink.appendChild(detailsDiv);
  detailsDiv.appendChild(h3);
  detailsDiv.appendChild(h4);
  detailsDiv.appendChild(h2);

  return boxDiv;
}

let mainContainer = document.getElementById("mainContainer");
let containerClothing = document.getElementById("containerClothing");
let containerAccessories = document.getElementById("containerAccessories");

// BACKEND CALLING USING FETCH
const API_BASE_URL = 'http://localhost:3000';

fetch(`${API_BASE_URL}/api/products`)
  .then(response => response.json())
  .then(contentTitle => {
    if (document.cookie.indexOf(",counter=") >= 0) {
      let counter = document.cookie.split(",")[1].split("=")[1];
      document.getElementById("badge").innerHTML = counter;
    }

    // Loop through the products and display them in respective sections
    for (let i = 0; i < contentTitle.length; i++) {
      if (contentTitle[i].isAccessory) {
        containerAccessories.appendChild(dynamicClothingSection(contentTitle[i]));
      } else {
        containerClothing.appendChild(dynamicClothingSection(contentTitle[i]));
      }
    }
  })
  .catch(error => {
    console.log("Error fetching data:", error);
    // Show error message to user
    const mainContainer = document.getElementById("mainContainer");
    if (mainContainer) {
      mainContainer.innerHTML = `
        <div class="error-message">
          <p>Error loading products. Please try again later.</p>
          <p class="error-details">Error details: ${error.message}</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  });

// Helper function to get placeholder images based on category
function getPlaceholderImage(category) {
    const baseUrl = 'https://placehold.co/300x300';
    const text = encodeURIComponent(category);
    return `${baseUrl}/f5f5f5/333333?text=${text}`;
}

// Function to load recommendations
function loadRecommendations(forceRefresh = false) {
    const userId = localStorage.getItem('userId') || 'USER001';
    const recommendationsContainer = document.querySelector('.recommendations-container');
    
    if (!recommendationsContainer) {
        console.error('Recommendations container not found');
        return;
    }
    
    console.log(`Loading recommendations for user ${userId}${forceRefresh ? ' (force refresh)' : ''}`);
    
    // Show loading state
    recommendationsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading-spinner"></div>
            <p>Loading recommendations...</p>
        </div>
    `;
    
    // Add cache buster to force fresh recommendations
    const cacheBuster = forceRefresh ? `&t=${Date.now()}` : '';
    
    // First try to get products from the server
    fetch(`${API_BASE_URL}/api/products`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            return response.json();
        })
        .then(fetchedProducts => {
            // Store products globally
            products = fetchedProducts;
            
            // Then try to get recommendations
            return fetch(`${API_BASE_URL}/api/recommendations/${userId}?force=${forceRefresh}${cacheBuster}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to get recommendations');
                    }
                    return response.json();
                })
                .catch(error => {
                    console.log('Using random recommendations as fallback');
                    
                    // Create a truly random selection using timestamp as seed
                    const timestamp = Date.now();
                    const shuffled = [...products].sort((a, b) => {
                        // Use product ID and timestamp to create a unique hash
                        const hashA = (parseInt(a.id.replace(/[^0-9]/g, '')) + timestamp) % products.length;
                        const hashB = (parseInt(b.id.replace(/[^0-9]/g, '')) + timestamp) % products.length;
                        return hashA - hashB;
                    });
                    
                    // Get 4 random products, ensuring variety in brands
                    const selectedProducts = [];
                    const brands = new Set();
                    
                    for (const product of shuffled) {
                        if (selectedProducts.length >= 4) break;
                        if (!brands.has(product.brand)) {
                            brands.add(product.brand);
                            selectedProducts.push(product);
                        }
                    }
                    
                    // If we don't have enough unique brands, add more products
                    while (selectedProducts.length < 4 && shuffled.length > 0) {
                        const product = shuffled.pop();
                        if (!selectedProducts.some(p => p.id === product.id)) {
                            selectedProducts.push(product);
                        }
                    }
                    
                    return selectedProducts;
                });
        })
        .then(recommendations => {
            console.log('Received recommendations:', recommendations);
            
            if (!Array.isArray(recommendations) || recommendations.length === 0) {
                console.warn('No recommendations received or empty array');
                recommendationsContainer.innerHTML = `
                    <div class="error-message">
                        <p>No recommendations available at the moment.</p>
                        <p>Make a purchase to get personalized recommendations!</p>
                    </div>
                `;
                return;
            }
            
            console.log(`Rendering ${recommendations.length} recommendations`);
            
            let html = `
                <button class="refresh-button" onclick="loadRecommendations(true)">
                    <i class="fas fa-sync-alt"></i> Refresh Recommendations
                </button>
                <div class="recommendations-grid">
            `;
            
            recommendations.forEach((product, index) => {
                console.log(`Recommendation ${index + 1}:`, product);
                
                // Handle image URLs with better fallbacks
                let imageUrl = product.preview || product.image;
                const category = product.category?.toLowerCase() || 'clothing';
                
                // Check if the image URL is valid and accessible
                if (!imageUrl || !isValidImageUrl(imageUrl)) {
                    imageUrl = getPlaceholderImage(category);
                }
                
                html += `
                    <div class="recommendation-item">
                        <div class="image-container">
                            <img src="${imageUrl}" 
                                 alt="${product.name}" 
                                 onerror="this.onerror=null; this.src='${getPlaceholderImage(category)}'"
                                 loading="lazy"
                                 class="product-image"
                                 data-category="${category}">
                            <div class="image-placeholder">
                                <div class="loading-spinner"></div>
                            </div>
                        </div>
                        <h3>${product.name}</h3>
                        <p class="brand">${product.brand}</p>
                        <p class="price">₹${product.price}</p>
                        <button onclick="addToCart('${product.id}')">Add to Cart</button>
                    </div>
                `;
            });
            
            html += '</div>';
            recommendationsContainer.innerHTML = html;
            
            // Add event listeners for image loading
            const images = recommendationsContainer.querySelectorAll('.product-image');
            images.forEach(img => {
                img.addEventListener('load', function() {
                    this.classList.add('loaded');
                    this.parentElement.querySelector('.image-placeholder').style.display = 'none';
                });
                
                img.addEventListener('error', function() {
                    const category = this.getAttribute('data-category');
                    this.src = getPlaceholderImage(category);
                });
            });
            
            console.log('Recommendations rendered successfully');
        })
        .catch(error => {
            console.error('Error loading recommendations:', error);
            recommendationsContainer.innerHTML = `
                <div class="error-message">
                    <p>Error loading recommendations. Please try again later.</p>
                    <p class="error-details">Error details: ${error.message}</p>
                    <button onclick="loadRecommendations(true)" style="margin-top: 10px;">Retry</button>
                </div>
            `;
        });
}

// Helper function to validate image URLs
function isValidImageUrl(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}

// Update the CSS for better image loading
const style = document.createElement('style');
style.textContent = `
    .image-container {
        width: 100%;
        height: 200px;
        overflow: hidden;
        position: relative;
        background: #f5f5f5;
        border-radius: 8px;
    }
    
    .image-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.3s ease;
        opacity: 0;
    }
    
    .image-container img.loaded {
        opacity: 1;
    }
    
    .image-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 8px;
    }
    
    .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .recommendation-item:hover .image-container img {
        transform: scale(1.05);
    }
    
    .recommendation-item {
        background: white;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.3s ease;
    }
    
    .recommendation-item:hover {
        transform: translateY(-5px);
    }
`;
document.head.appendChild(style);

// Add image load event handler with retry logic
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.product-image');
    images.forEach(img => {
        let retryCount = 0;
        const maxRetries = 2;
        
        const loadImage = () => {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
                this.parentElement.querySelector('.image-placeholder').style.display = 'none';
            });
            
            img.addEventListener('error', function() {
                if (retryCount < maxRetries) {
                    retryCount++;
                    // Try loading the image again after a delay
                    setTimeout(() => {
                        this.src = this.src;
                    }, 1000);
                } else {
                    // After max retries, use placeholder
                    this.src = getPlaceholderImage(this.getAttribute('data-category') || 'clothing');
                }
            });
        };
        
        loadImage();
    });
});

// Initialize cart badge and load recommendations when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    // Check if we're coming from order placement
    const fromOrder = sessionStorage.getItem('fromOrder');
    if (fromOrder) {
        sessionStorage.removeItem('fromOrder');
        // Force refresh recommendations
        setTimeout(() => {
            loadRecommendations(true);
        }, 1000);
    } else {
        loadRecommendations();
    }
});

function displayRecommendations(recommendations) {
    const recommendationsContainer = document.getElementById('recommendations');
    recommendationsContainer.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        recommendationsContainer.innerHTML = '<p>No recommendations available at the moment.</p>';
        return;
    }

    recommendations.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <img src="/images/${product.preview_image}" alt="${product.name}" onerror="this.src='/images/placeholder.jpg'">
            <h3>${product.name}</h3>
            <p>₹${product.price}</p>
            <button onclick="addToCart('${product.sku_id}')">Add to Cart</button>
        `;
        recommendationsContainer.appendChild(productElement);
    });
}

// Cart management functions
function addToCart(productId) {
    try {
        // Get current cart from localStorage or initialize empty cart
        let cart = JSON.parse(localStorage.getItem('cart'));
        if (!Array.isArray(cart)) {
            cart = [];
        }
        
        // Find the product in products array
        const product = products.find(p => p.id === productId);
        
        if (product) {
            // Check if product already in cart
            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                // Increment quantity if already in cart
                existingItem.quantity = (existingItem.quantity || 0) + 1;
            } else {
                // Add new item to cart
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    preview: product.preview
                });
            }
            
            // Save updated cart to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart badge
            updateCartBadge();
            
            // Show success message
            showNotification('Item added to cart!');
            
            // After adding to cart, refresh recommendations
            setTimeout(() => {
                loadRecommendations(true);
            }, 1000);
        } else {
            console.error('Product not found:', productId);
            showNotification('Error adding item to cart. Product not found.');
        }
    } catch (error) {
        console.error('Error in addToCart:', error);
        showNotification('Error adding item to cart. Please try again.');
    }
}

function updateCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart'));
        const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
        const badge = document.getElementById('badge');
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error updating cart badge:', error);
        const badge = document.getElementById('badge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add styles if they don't exist
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 25px;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
                animation: slideIn 0.5s ease-out;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add notification to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function placeOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const order = {
        user_id: localStorage.getItem('userId') || 'USER001',
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString()
    };

    // Show loading state
    const recommendationsContainer = document.querySelector('.recommendations-container');
    if (recommendationsContainer) {
        recommendationsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                <p>Processing order and updating recommendations...</p>
            </div>
        `;
    }

    fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Order placed successfully:', data);
        
        // Clear the cart
        localStorage.removeItem('cart');
        updateCartBadge();
        
        // Show success message
        showNotification('Order placed successfully!');
        
        // Wait for model retraining and then refresh recommendations
        return new Promise((resolve) => {
            setTimeout(() => {
                // First try to refresh recommendations
                loadRecommendations(true);
                // Then redirect after a short delay
                setTimeout(() => {
                    window.location.href = 'orderPlaced.html';
                }, 1000);
                resolve();
            }, 3000); // Increased delay to ensure model is retrained
        });
    })
    .catch(error => {
        console.error('Error placing order:', error);
        showNotification('Error placing order. Please try again.');
    });
}
