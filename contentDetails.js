console.clear();

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id") ? urlParams.get("id").trim() : null;

console.log("Extracted Product ID:", id);

// Replace the URL for fetching product data with the backend API URL
fetch("http://localhost:3000/api/products")  // Update with the correct API endpoint
    .then(response => {
        console.log("Fetching Product Data...");
        if (!response.ok) throw new Error("Failed to load products from API");
        return response.json();
    })
    .then(data => {
        console.log("Loaded Product Data:", data);
        if (!id) {
            console.error("No Product ID found in URL.");
            return;
        }

        console.log("🔎 Searching for ID:", id);
        const product = data.find(item => item.id.toString() === id);
        console.log("🔍 Matched Product:", product);

        if (product) {
            renderProductDetails(product);
        } else {
            console.error("Product Not Found for ID:", id);
            document.getElementById("containerProduct").innerHTML = "<h2>Product Not Found</h2>";
        }
    })
    .catch(error => console.error("Error Fetching Product Data:", error));

function renderProductDetails(product) {
    const container = document.getElementById("containerProduct");
    container.innerHTML = "";

    const mainContainer = document.createElement("div");
    mainContainer.id = "containerD";

    const imageSection = document.createElement("div");
    imageSection.id = "imageSection";

    const mainImage = document.createElement("img");
    mainImage.id = "imgDetails";
    mainImage.src = product.preview;
    mainImage.alt = product.name;
    imageSection.appendChild(mainImage);

    const productDetails = document.createElement("div");
    productDetails.id = "productDetails";

    const productName = document.createElement("h1");
    productName.textContent = product.name;

    const productBrand = document.createElement("h4");
    productBrand.textContent = product.brand;

    const priceSection = document.createElement("div");
    priceSection.id = "details";

    const priceTag = document.createElement("h3");
    priceTag.textContent = `Rs ${product.price}`;

    const descriptionTitle = document.createElement("h3");
    descriptionTitle.textContent = "Description";

    const description = document.createElement("p");
    description.textContent = product.description || "No description available";

    priceSection.append(priceTag, descriptionTitle, description);

    const buttonSection = document.createElement("div");
    buttonSection.id = "button";

    const cartButton = document.createElement("button");
    cartButton.textContent = "Add to Cart";
    
    cartButton.onclick = function () {
        let cartData = JSON.parse(localStorage.getItem("cart")) || {};
        cartData[id] = (cartData[id] || 0) + 1;
        localStorage.setItem("cart", JSON.stringify(cartData));
        updateCartBadge();
        console.log("Cart Updated:", localStorage.getItem("cart"));
    };
    
    buttonSection.appendChild(cartButton);
    productDetails.append(productName, productBrand, priceSection, buttonSection);
    mainContainer.append(imageSection, productDetails);
    container.appendChild(mainContainer);
}

function updateCartBadge() {
    const cartData = JSON.parse(localStorage.getItem("cart")) || {};
    const totalItems = Object.values(cartData).reduce((sum, qty) => sum + qty, 0);
    const badge = document.getElementById("badge");
    if (badge) {
        badge.textContent = totalItems;
    }
}
