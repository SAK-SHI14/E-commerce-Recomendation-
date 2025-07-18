// Set cookies for orderId and counter
document.cookie = "orderId=" + 0 + "; path=/";
document.cookie = "counter=" + 0 + "; path=/";

// Create a new XMLHttpRequest instance
let httpRequest = new XMLHttpRequest(),
    jsonArray,
    method = "GET",
    jsonRequestURL = "https://5d76bf96515d1a0014085cf9.mockapi.io/order";

httpRequest.open(method, jsonRequestURL, true);

// Handle response after GET request
httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === 4 && httpRequest.status === 200) {
        // Parse the response text to get the JSON array
        jsonArray = JSON.parse(httpRequest.responseText);
        console.log(jsonArray);

        // Add a new order to the array
        jsonArray.push({
            "id": jsonArray.length + 1, // Calculate new ID based on the current length
            "amount": 200,              // Example amount, adjust as needed
            "product": ["userOrder"]    // Example product array, adjust as needed
        });

        // Send the updated data back to the server via POST request
        let postRequest = new XMLHttpRequest();
        postRequest.open("POST", jsonRequestURL, true);
        postRequest.setRequestHeader("Content-Type", "application/json");
        
        // Convert the updated array to JSON string and send it
        postRequest.send(JSON.stringify(jsonArray));
    }
};

// Send the GET request to retrieve existing orders
httpRequest.send(null);

function placeOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const userId = localStorage.getItem('userId') || 'USER001';
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Create new order
    const newOrder = {
        order_id: `ORD${Date.now()}`,
        user_id: userId,
        items: cart.map(item => ({
            sku_id: item.id,
            quantity: item.quantity || 1
        })),
        order_date: new Date().toISOString().split('T')[0]
    };

    console.log('Placing order:', newOrder);

    // Send order to server
    fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrder)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save order');
        }
        return response.json();
    })
    .then(data => {
        console.log('Order saved:', data);
        
        // Clear cart
        localStorage.removeItem('cart');
        alert('Order placed successfully!');
        
        // Retrain the model
        return fetch('http://localhost:3000/retrain-model', {
            method: 'POST'
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to retrain model');
        }
        return response.json();
    })
    .then(data => {
        console.log('Model retrained:', data);
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('Error in order placement:', error);
        alert('Error placing order. Please try again.');
    });
}

// After successful order placement
function orderSuccess() {
    // Clear cart
    document.cookie = "counter=0";
    
    // Update cart badge
    document.getElementById("badge").innerHTML = 0;
    
    // Show success message
    document.getElementById("success-message").style.display = "block";
    
    // Set flag to refresh recommendations when returning to main page
    sessionStorage.setItem('fromOrder', 'true');
    
    // Redirect to main page after a delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}
