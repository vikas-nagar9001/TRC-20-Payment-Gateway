require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const paymentRoutes = require('./routes/payment');

// Import services for cleanup job
const PaymentService = require('./services/PaymentService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            scriptSrcAttr: ["'unsafe-inline'"] // Allow inline event handlers
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your domain
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        service: 'TRC-20 Payment Gateway',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// 404 handler for other routes
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// MongoDB connection
async function connectToDatabase() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trc20_payments';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Create indexes
        const { Transaction, PaymentRequest } = require('./models/Transaction');
        await Transaction.createIndexes();
        await PaymentRequest.createIndexes();
        console.log('✅ Database indexes created');
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Cleanup job for expired payment requests
function startCleanupJob() {
    const paymentService = new PaymentService();
    
    // Run cleanup every 5 minutes
    setInterval(async () => {
        try {
            await paymentService.cleanupExpiredRequests();
        } catch (error) {
            console.error('Cleanup job error:', error);
        }
    }, 5 * 60 * 1000);
    
    console.log('✅ Cleanup job started');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectToDatabase();
        
        // Start cleanup job
        startCleanupJob();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 TRC-20 Payment Gateway server running on port ${PORT}`);
            console.log(`📱 Open http://localhost:${PORT} to access the payment gateway`);
            console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/payment`);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log('\n📋 Environment Configuration:');
                console.log(`   - Gateway Address: ${process.env.GATEWAY_WALLET_ADDRESS || 'TJK6vTviYJ468yfUC3vGzRoZtSvY72rYbM'}`);
                console.log(`   - MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/trc20_payments'}`);
                console.log(`   - Payment Timeout: ${process.env.PAYMENT_TIMEOUT_MINUTES || 30} minutes`);
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the application
startServer();
