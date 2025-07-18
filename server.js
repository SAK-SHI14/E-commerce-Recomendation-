const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5502'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json());

// Helper function to read JSON file
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// Serve the root page (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to serve product data
app.get('/api/products', (req, res) => {
    const products = readJsonFile('products.json');
    res.json(products);
});

// Get order history
app.get('/api/orders', (req, res) => {
    const orders = readJsonFile('order.json');
    res.json(orders);
});

// Add new order
app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    console.log('Received new order:', newOrder);
    
    // Read existing orders
    let orders = [];
    try {
        const ordersData = fs.readFileSync('order.json', 'utf8');
        orders = JSON.parse(ordersData);
    } catch (error) {
        console.error('Error reading orders:', error);
    }
    
    // Add new order
    orders.push(newOrder);
    
    // Write updated orders
    try {
        fs.writeFileSync('order.json', JSON.stringify(orders, null, 2));
        console.log('Order saved successfully');
        
        // Retrain the model
        const pythonProcess = spawn('python', ['train_knn.py']);
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Model retraining failed:', error);
                return res.status(500).json({ error: 'Failed to retrain model' });
            }
            
            console.log('Model retrained successfully');
            res.json({ message: 'Order saved and model retrained successfully' });
        });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// Recommendations endpoint
app.get('/api/recommendations/:userId', (req, res) => {
    const userId = req.params.userId;
    const forceRefresh = req.query.force === 'true';
    
    console.log(`Getting recommendations for user ${userId}${forceRefresh ? ' (force refresh)' : ''}`);
    
    // Check if model files exist
    if (!fs.existsSync('knn_model.pkl')) {
        console.error('Model files not found');
        return res.status(500).json({ error: 'Recommendation system not ready' });
    }
    
    const pythonProcess = spawn('python', ['reccomend.py', userId]);
    let recommendations = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
        recommendations += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.log('Python debug:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Python process error:', error);
            return res.status(500).json({ error: 'Failed to get recommendations' });
        }
        
        try {
            const parsedRecommendations = JSON.parse(recommendations);
            console.log('Detailed recommendations:');
            parsedRecommendations.forEach((rec, index) => {
                console.log(`Recommendation ${index + 1}:`);
                console.log(`  ID: ${rec.id}`);
                console.log(`  Name: ${rec.name}`);
                console.log(`  Brand: ${rec.brand}`);
                console.log(`  Price: ${rec.price}`);
                console.log(`  Preview: ${rec.preview}`);
                console.log('-------------------');
            });
            console.log(`Successfully got ${parsedRecommendations.length} recommendations for user ${userId}`);
            res.json(parsedRecommendations);
        } catch (e) {
            console.error('JSON parse error:', e);
            console.error('Raw output:', recommendations);
            res.status(500).json({ error: 'Invalid recommendations data' });
        }
    });
});

// Retrain model endpoint
app.post('/retrain-model', (req, res) => {
    console.log('Starting model retraining...');
    const pythonProcess = spawn('python', ['train_knn.py'], {
        cwd: __dirname
    });
    
    let output = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Training output:', data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error('Training error:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Model training failed:', error);
            res.status(500).json({ error: 'Failed to retrain model', details: error });
            return;
        }
        
        console.log('Model retraining completed successfully');
        res.json({ message: 'Model retrained successfully', output });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
