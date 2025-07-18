console.clear();

// Update cart badge
function updateCartBadge() {
    let cartData = JSON.parse(localStorage.getItem("cart")) || {};
    let totalItems = Object.values(cartData).reduce((sum, qty) => sum + qty, 0);
    let badge = document.getElementById("badge");
    if (badge) {
        badge.textContent = totalItems;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let cartContainer = document.getElementById("cartContainer");
    let boxContainerDiv = document.createElement("div");
    boxContainerDiv.id = "boxContainer";
    cartContainer.appendChild(boxContainerDiv);

    let totalContainerDiv = document.createElement("div");
    totalContainerDiv.id = "totalContainer";

    let totalDiv = document.createElement("div");
    totalDiv.id = "total";
    totalContainerDiv.appendChild(totalDiv);

    let totalh2 = document.createElement("h2");
    totalh2.textContent = "Total Amount";
    totalDiv.appendChild(totalh2);

    let totalAmountText = document.createElement("h4");
    totalAmountText.id = "totalAmountText"; // Added to prevent duplicates
    totalDiv.appendChild(totalAmountText);

    let buttonDiv = document.createElement("div");
    buttonDiv.id = "button";
    totalDiv.appendChild(buttonDiv);

    let buttonTag = document.createElement("button");
    buttonDiv.appendChild(buttonTag);
    buttonTag.textContent = "Place Order";

    buttonTag.onclick = function () {
        if (Object.keys(cartData).length === 0) {
            alert("Your cart is empty! Add some products first.");
            return;
        }

        if (confirm("Are you sure you want to place the order?")) {
            localStorage.removeItem("cart"); // Clear cart on order placement
            updateCartBadge();
            window.location.href = "/orderPlaced.html";
        }
    };

    cartContainer.appendChild(totalContainerDiv);

    let cartData = JSON.parse(localStorage.getItem("cart")) || {};
    if (Object.keys(cartData).length === 0) {
        boxContainerDiv.innerHTML = "<h3>Your cart is empty!</h3>";
        return;
    }

    // Fetch product data from the new API
    fetch("http://localhost:3000/api/products")
        .then(response => response.json())
        .then(products => {
            let totalAmount = 0;
            Object.keys(cartData).forEach(id => {
                let product = products.find(p => p.id.toString() === id);
                if (product) {
                    totalAmount += product.price * cartData[id];

                    let boxDiv = document.createElement("div");
                    boxDiv.className = "cart-item";
                    boxContainerDiv.appendChild(boxDiv);

                    let boxImg = document.createElement("img");
                    boxImg.src = product.preview;
                    boxImg.alt = product.name;
                    boxDiv.appendChild(boxImg);

                    let boxh3 = document.createElement("h3");
                    boxh3.textContent = `${product.name} × ${cartData[id]}`;
                    boxDiv.appendChild(boxh3);

                    let boxh4 = document.createElement("h4");
                    boxh4.textContent = `Amount: Rs ${product.price * cartData[id]}`;
                    boxDiv.appendChild(boxh4);
                }
            });

            totalAmountText.textContent = `Amount: Rs ${totalAmount}`;
            updateCartBadge();
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            boxContainerDiv.innerHTML = "<h3>Error loading cart items. Please try again.</h3>";
        });
});
