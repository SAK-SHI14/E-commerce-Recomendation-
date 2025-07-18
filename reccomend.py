import numpy as np
import joblib
import json
import sys
import os
from sklearn.preprocessing import LabelEncoder
from collections import defaultdict

def get_user_preferences(user_id, orders, products):
    brand_prefs = defaultdict(int)
    category_prefs = defaultdict(int)
    price_sum = 0
    price_count = 0
    recent_items = set()
    
    # Getting user's orders sorted by date (newest first)
    user_orders = sorted(
        [order for order in orders if order['user_id'] == user_id],
        key=lambda x: x['order_date'],
        reverse=True
    )
    
    # Analysing last 3 orders for recent preferences
    for order in user_orders[:3]:
        for item in order['items']:
            sku_id = item['sku_id']
            product = next((p for p in products if p['id'] == sku_id), None)
            if product:
                brand_prefs[product['brand']] += 1
                category_prefs[product.get('category', 'Clothing')] += 1
                price_sum += product['price']
                price_count += 1
                recent_items.add(sku_id)
    
    avg_price = price_sum / price_count if price_count > 0 else 0
    
    return {
        'brand_prefs': dict(brand_prefs),
        'category_prefs': dict(category_prefs),
        'avg_price': avg_price,
        'recent_items': list(recent_items)
    }

def get_recommendations(user_id, n_recommendations=4):
    # Loading model components
    print("Loading model, encoder, and scaler...", file=sys.stderr)
    try:
        knn_model = joblib.load('knn_model.pkl')
        encoder = joblib.load('encoder.pkl')
        scaler = joblib.load('scaler.pkl')
        print("Successfully loaded model components", file=sys.stderr)
    except Exception as e:
        print(f"Error loading model components: {e}", file=sys.stderr)
        return []

    # Loading data
    with open('products.json', 'r') as f:
        products = json.load(f)
    print(f"Loaded {len(products)} products", file=sys.stderr)

    with open('order.json', 'r') as f:
        orders = json.load(f)
    print(f"Loaded {len(orders)} orders", file=sys.stderr)

    # Getting user preferences
    prefs = get_user_preferences(user_id, orders, products)
    print("\nUser Preferences:", file=sys.stderr)
    print(f"Brand preferences: {prefs['brand_prefs']}", file=sys.stderr)
    print(f"Category preferences: {prefs['category_prefs']}", file=sys.stderr)
    print(f"Average price: {prefs['avg_price']}", file=sys.stderr)
    print(f"Recent items: {prefs['recent_items']}", file=sys.stderr)

    # Getting all items not recently purchased
    available_items = [
        p for p in products 
        if p['id'] not in prefs['recent_items']
    ]
    print(f"\nAvailable items for recommendation: {len(available_items)}", file=sys.stderr)

    # Scoring items based on preferences
    scored_items = []
    for item in available_items:
        score = 0
        
        # Branding preference score
        brand_score = prefs['brand_prefs'].get(item['brand'], 0)
        score += brand_score * 2  # Higher weight for brand preference
        
        # Categorising preference score
        category_score = prefs['category_prefs'].get(item.get('category', 'Clothing'), 0)
        score += category_score
        
        # Price similarity score (closer to average price is better)
        price_diff = abs(item['price'] - prefs['avg_price'])
        price_score = 1 / (1 + price_diff / 1000)  # Normalize price difference
        score += price_score
        
        scored_items.append((item, score))

    # Sorting by score and get top recommendations
    scored_items.sort(key=lambda x: x[1], reverse=True)
    recommendations = [item for item, score in scored_items[:n_recommendations]]
    
    print("\nTop Recommendations (with scores):", file=sys.stderr)
    for item, score in scored_items[:n_recommendations]:
        print(f"\nItem: {item['name']}", file=sys.stderr)
        print(f"Brand: {item['brand']}", file=sys.stderr)
        print(f"Price: {item['price']}", file=sys.stderr)
        print(f"Score: {score}", file=sys.stderr)
        print("-------------------", file=sys.stderr)
    
    print(f"\nReturning {len(recommendations)} recommendations", file=sys.stderr)
    return recommendations

def main():
    try:
        if len(sys.argv) != 2:
            print("Usage: python reccomend.py <user_id>", file=sys.stderr)
            sys.exit(1)
        
        user_id = sys.argv[1]
        recommendations = get_recommendations(user_id)
        
        # Ensuring we have a list of recommendations
        if not isinstance(recommendations, list):
            recommendations = []
        
        # Printing only the JSON to stdout
        print(json.dumps(recommendations, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error in main: {str(e)}", file=sys.stderr)
        # Returning empty list as JSON
        print("[]")
        sys.exit(1)

if __name__ == "__main__":
    main()
