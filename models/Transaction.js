const mongoose = require('mongoose');

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    txid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    fromAddress: {
        type: String,
        required: true
    },
    toAddress: {
        type: String,
        required: true
    },
    amount: {
        type: String, // Store as string to handle BigInt values
        required: true
    },
    tokenType: {
        type: String,
        enum: ['TRX', 'USDT', 'USDC', 'OTHER'],
        required: true
    },
    contractAddress: {
        type: String,
        default: null // null for native TRX
    },
    decimals: {
        type: Number,
        default: 6 // TRX and USDT both use 6 decimals
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'FAILED'],
        default: 'CONFIRMED'
    },
    blockNumber: {
        type: Number,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    verifiedAt: {
        type: Date,
        default: Date.now
    },
    userRequestedAmount: {
        type: String,
        required: true
    },
    // Additional metadata
    metadata: {
        userAgent: String,
        ipAddress: String,
        paymentMethod: String
    }
}, {
    timestamps: true
});

// Payment Request Schema (for tracking pending payments)
const paymentRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    amount: {
        type: String,
        required: true
    },
    tokenType: {
        type: String,
        enum: ['TRX', 'USDT', 'USDC', 'OTHER'],
        required: true
    },
    contractAddress: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED'],
        default: 'PENDING'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    completedTxid: {
        type: String,
        default: null
    },
    metadata: {
        userAgent: String,
        ipAddress: String
    }
}, {
    timestamps: true
});

// Create indexes for better performance
transactionSchema.index({ toAddress: 1, timestamp: -1 });
transactionSchema.index({ fromAddress: 1, timestamp: -1 });
transactionSchema.index({ tokenType: 1, timestamp: -1 });

paymentRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
paymentRequestSchema.index({ status: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);

module.exports = {
    Transaction,
    PaymentRequest
};
