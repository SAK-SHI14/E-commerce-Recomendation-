// Chatbot functionality
let chatHistory = [];

function toggleChat() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    chatbotWindow.style.display = chatbotWindow.style.display === 'none' ? 'flex' : 'none';
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    const messagesContainer = document.getElementById('chatbotMessages');
    
    if (message) {
        userInput.value = '';
        
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user-message';
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading';
        loadingDiv.textContent = "Thinking...";
        messagesContainer.appendChild(loadingDiv);
        
        try {
            const response = await getGeminiResponse(message);
            
            messagesContainer.removeChild(loadingDiv);
            
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'message bot-message';
            botMessageDiv.innerHTML = marked.parse(response);
            messagesContainer.appendChild(botMessageDiv);
            
            chatHistory.push(
                { role: "user", parts: [{ text: message }] },
                { role: "model", parts: [{ text: response }] }
            );
        } catch (error) {
            messagesContainer.removeChild(loadingDiv);
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message bot-message error';
            errorDiv.textContent = "Sorry, I encountered an error. Please try again.";
            messagesContainer.appendChild(errorDiv);
            console.error('Error:', error);
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

async function getGeminiResponse(message) {
    const lowerMessage = message.toLowerCase();

    const predefinedResponses = {
        "saree": "We offer a stunning range of sarees priced between ₹2000 and ₹7000. Are you looking for silk, chiffon, or bridal sarees? 💖",
        "blouse": "Looking for the perfect blouse? Our collection ranges from ₹1000 to ₹2000. Do you need an embroidered, plain, or designer blouse? ✨",
        "bottoms": "Explore our ethnic bottoms collection, including palazzos, skirts, leggings, and shararas. What style suits your outfit? 😊",
        "dupatta": "Complete your look with our elegant dupattas, priced between ₹1000 and ₹2000. What are you looking for today? 🧣",
        "tunics": "Our tunics are perfect for casual, office, or festive wear, with prices ranging from ₹1500 to ₹4000. Would you like a long or short tunic? 🎉",
        "kurta": "Browse our exquisite kurtas, available from ₹1500 to ₹4000: Anarkali, straight-cut, A-line, printed, and solid colors. What’s your preference? 👗",
        "discounts": "Yes! We have exclusive discounts on select ethnic wear. Would you like to check our latest offers? 🛍️",
        "bridal collection": "Our bridal collection features luxurious designs for your big day. Do you prefer intricate embroidery or a minimalistic look? 💍",
        "order status": "To check your order status, please provide your order ID or registered email. 📦",
        "payment options": "We accept Credit/Debit cards, UPI, COD, and PayPal. Which payment method would you like to use? 💳",
        "shipping": "We offer Standard and Express shipping. Free shipping is available for orders above ₹5000. Need more details? 🚚",
        "international shipping": "Yes, we ship internationally to select countries! Please provide your location for availability details. 🌍",
        "return policy": "We accept returns within 10 days of delivery for unused items with tags. Would you like to initiate a return? 🔄",
        "refund policy": "Refunds are processed within 5-7 business days after we receive the returned item. Do you need help with a refund request? 💰",
        "styling tips": "Looking for fashion advice? I can suggest outfit pairings, color combinations, and accessories to match! What’s the occasion? 👗"
    };

    for (const key in predefinedResponses) {
        if (lowerMessage.includes(key)) {
            return predefinedResponses[key];
        }
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an expert in ethnic clothing and e-commerce. Provide detailed responses related to sarees, blouses, bottoms, dupattas, tunics, and kurtas. Recommend products based on occasion, fabric, price range, and styling preferences. User's message: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        throw error;
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
