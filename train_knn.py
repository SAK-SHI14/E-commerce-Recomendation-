import os
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import json

print("Starting model training...")
print(f"numpy version: {np.__version__}")
print(f"scikit-learn version: {pd.__version__}")
print(f"joblib version: {joblib.__version__}")

# Creating models directory if it doesn't exist
models_dir = os.path.join(os.getcwd(), "models")
if not os.path.exists(models_dir):
    os.makedirs(models_dir)

# Loading products data
with open('products.json', 'r') as f:
    products = json.load(f)
print(f"Loaded {len(products)} products")

# Loading order history
with open('order.json', 'r') as f:
    order_history = json.load(f)
print(f"Loaded {len(order_history)} orders")

# Creating user-item matrix
user_items = {}
for order in order_history:
    user_id = order['user_id']
    if user_id not in user_items:
        user_items[user_id] = []
    for item in order['items']:
        user_items[user_id].append(item['sku_id'])

# Getting all unique items
all_items = set()
for items in user_items.values():
    all_items.update(items)

print(f"Found {len(all_items)} unique items in orders")

# Creating label encoder for item IDs
label_encoder = LabelEncoder()
label_encoder.fit(list(all_items))

# Creating item vectors with 4 features
item_matrix = []
item_ids = []

for item_id in all_items:
    # Feature 1: Encoded item ID
    encoded_id = label_encoder.transform([item_id])[0]
    
    # Feature 2: Frequency of item in orders
    frequency = sum(1 for items in user_items.values() if item_id in items)
    
    # Feature 3: Average quantity per order
    total_quantity = sum(order['items'][i]['quantity'] 
                        for order in order_history 
                        for i, item in enumerate(order['items']) 
                        if item['sku_id'] == item_id)
    avg_quantity = total_quantity / frequency if frequency > 0 else 0
    
    # Feature 4: Number of unique users who purchased this item
    user_count = len(set(order['user_id'] 
                        for order in order_history 
                        for item in order['items'] 
                        if item['sku_id'] == item_id))
    
    item_vector = [encoded_id, frequency, avg_quantity, user_count]
    item_matrix.append(item_vector)
    item_ids.append(item_id)

# Converting to numpy array
item_matrix = np.array(item_matrix)

# Scaling the features
scaler = StandardScaler()
scaled_matrix = scaler.fit_transform(item_matrix)

# Calculating number of neighbors (min of 5 or number of items - 1)
n_neighbors = min(5, len(all_items) - 1)
print(f"Using {n_neighbors} neighbors for KNN model")

# Training KNN model with dynamic number of neighbors
knn_model = NearestNeighbors(n_neighbors=n_neighbors, metric='euclidean')
knn_model.fit(scaled_matrix)

# Saving the model, encoder, and scaler
model_path = "knn_model.pkl"
encoder_path = "encoder.pkl"
scaler_path = "scaler.pkl"

# Saving the number of neighbors for the recommendation script
with open("model_config.json", "w") as f:
    json.dump({"n_neighbors": n_neighbors}, f)

joblib.dump(knn_model, model_path)
joblib.dump(label_encoder, encoder_path)
joblib.dump(scaler, scaler_path)

print("Model trained and saved successfully")
print(f"Model saved to: {model_path}")
print(f"Encoder saved to: {encoder_path}")
print(f"Scaler saved to: {scaler_path}")
print(f"Model config saved to: model_config.json")
