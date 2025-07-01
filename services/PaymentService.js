const { Transaction, PaymentRequest } = require('../models/Transaction');
const TronGridService = require('./TronGridService');
const crypto = require('crypto');

class PaymentService {
    constructor() {
        this.tronGrid = new TronGridService();
        this.gatewayAddress = process.env.GATEWAY_WALLET_ADDRESS;
    }

    /**
     * Create a new payment request
     * @param {string} amount - Requested amount
     * @param {string} tokenType - Token type (TRX, USDT, etc.)
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Payment request details
     */
    async createPaymentRequest(amount, tokenType, metadata = {}) {
        try {
            // Generate unique request ID
            const requestId = crypto.randomBytes(16).toString('hex');
            
            // Set expiration time (30 minutes from now by default)
            const expirationMinutes = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES) || 30;
            const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

            // Get contract address for tokens
            const contractAddress = this.getContractAddress(tokenType);

            // Validate amount format
            const decimals = this.tronGrid.getTokenDecimals(tokenType);
            const amountInSmallestUnits = this.tronGrid.parseAmount(amount, decimals);

            const paymentRequest = new PaymentRequest({
                requestId,
                amount: amountInSmallestUnits,
                tokenType,
                contractAddress,
                expiresAt,
                metadata
            });

            await paymentRequest.save();

            return {
                requestId,
                amount,
                tokenType,
                contractAddress,
                gatewayAddress: this.gatewayAddress,
                expiresAt,
                qrCodeData: this.generateQRData(amount, tokenType, contractAddress)
            };

        } catch (error) {
            console.error('Error creating payment request:', error.message);
            throw new Error(`Failed to create payment request: ${error.message}`);
        }
    }

    /**
     * Verify a transaction and process payment
     * @param {string} txid - Transaction ID
     * @param {string} requestId - Payment request ID
     * @returns {Promise<Object>} Verification result
     */
    async verifyPayment(txid, requestId) {
        try {
            // Check if transaction already exists
            const existingTx = await Transaction.findOne({ txid });
            if (existingTx) {
                return {
                    success: false,
                    error: 'Transaction ID already used',
                    errorCode: 'DUPLICATE_TXID'
                };
            }

            // Get payment request
            const paymentRequest = await PaymentRequest.findOne({ requestId });
            if (!paymentRequest) {
                return {
                    success: false,
                    error: 'Payment request not found',
                    errorCode: 'REQUEST_NOT_FOUND'
                };
            }

            // Check if payment request has expired
            if (new Date() > paymentRequest.expiresAt) {
                return {
                    success: false,
                    error: 'Payment request has expired',
                    errorCode: 'REQUEST_EXPIRED'
                };
            }

            // Check if payment request is already completed
            if (paymentRequest.status === 'COMPLETED') {
                return {
                    success: false,
                    error: 'Payment request already completed',
                    errorCode: 'REQUEST_COMPLETED'
                };
            }

            // Verify transaction with TronGrid
            const verification = await this.tronGrid.verifyTransaction(
                txid,
                this.gatewayAddress,
                paymentRequest.amount,
                paymentRequest.tokenType,
                paymentRequest.contractAddress
            );

            if (!verification.valid) {
                return {
                    success: false,
                    error: verification.error,
                    errorCode: 'VERIFICATION_FAILED'
                };
            }

            // Save transaction to database
            const transaction = new Transaction({
                txid,
                fromAddress: verification.details.fromAddress,
                toAddress: verification.details.toAddress,
                amount: verification.details.amount,
                tokenType: verification.details.tokenType,
                contractAddress: verification.details.contractAddress,
                decimals: this.tronGrid.getTokenDecimals(verification.details.tokenType),
                blockNumber: verification.details.blockNumber,
                timestamp: new Date(verification.details.timestamp),
                userRequestedAmount: paymentRequest.amount,
                status: 'CONFIRMED'
            });

            await transaction.save();

            // Update payment request status
            paymentRequest.status = 'COMPLETED';
            paymentRequest.completedTxid = txid;
            await paymentRequest.save();

            // Format amounts for display
            const humanAmount = this.tronGrid.formatAmount(
                verification.details.amount,
                this.tronGrid.getTokenDecimals(verification.details.tokenType)
            );

            return {
                success: true,
                transaction: {
                    txid,
                    fromAddress: verification.details.fromAddress,
                    toAddress: verification.details.toAddress,
                    amount: humanAmount,
                    tokenType: verification.details.tokenType,
                    timestamp: verification.details.timestamp
                }
            };

        } catch (error) {
            console.error('Error verifying payment:', error.message);
            return {
                success: false,
                error: `Verification failed: ${error.message}`,
                errorCode: 'INTERNAL_ERROR'
            };
        }
    }

    /**
     * Get payment request details
     * @param {string} requestId - Payment request ID
     * @returns {Promise<Object>} Payment request details
     */
    async getPaymentRequest(requestId) {
        try {
            const paymentRequest = await PaymentRequest.findOne({ requestId });
            if (!paymentRequest) {
                return null;
            }

            const humanAmount = this.tronGrid.formatAmount(
                paymentRequest.amount,
                this.tronGrid.getTokenDecimals(paymentRequest.tokenType)
            );

            return {
                requestId: paymentRequest.requestId,
                amount: humanAmount,
                tokenType: paymentRequest.tokenType,
                contractAddress: paymentRequest.contractAddress,
                status: paymentRequest.status,
                expiresAt: paymentRequest.expiresAt,
                createdAt: paymentRequest.createdAt,
                completedTxid: paymentRequest.completedTxid
            };

        } catch (error) {
            console.error('Error getting payment request:', error.message);
            throw new Error(`Failed to get payment request: ${error.message}`);
        }
    }

    /**
     * Get transaction history
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Transaction history
     */
    async getTransactionHistory(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            const transactions = await Transaction.find()
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Transaction.countDocuments();

            const formattedTransactions = transactions.map(tx => ({
                txid: tx.txid,
                fromAddress: tx.fromAddress,
                toAddress: tx.toAddress,
                amount: this.tronGrid.formatAmount(tx.amount, tx.decimals),
                tokenType: tx.tokenType,
                status: tx.status,
                timestamp: tx.timestamp,
                verifiedAt: tx.verifiedAt
            }));

            return {
                transactions: formattedTransactions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit
                }
            };

        } catch (error) {
            console.error('Error getting transaction history:', error.message);
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }

    /**
     * Get contract address for a token type
     * @param {string} tokenType - Token type
     * @returns {string|null} Contract address
     */
    getContractAddress(tokenType) {
        const contracts = {
            'USDT': process.env.USDT_CONTRACT_ADDRESS || '41a614f803b6fd780986a42c78ec9c7f77e6ded13c',
            'USDC': process.env.USDC_CONTRACT_ADDRESS || '41b8ae8b62f2a4cc78e3f66c45b5acfedb924fd2a6'
        };

        return contracts[tokenType] || null;
    }

    /**
     * Generate QR code data for payment
     * @param {string} amount - Amount to pay
     * @param {string} tokenType - Token type
     * @param {string} contractAddress - Contract address
     * @returns {string} QR code data
     */
    generateQRData(amount, tokenType, contractAddress) {
        if (tokenType === 'TRX') {
            // TRON URI format for native TRX
            return `tron:${this.gatewayAddress}?amount=${amount}`;
        } else {
            // For TRC-20 tokens, include contract address
            return `tron:${this.gatewayAddress}?contract=${contractAddress}&amount=${amount}`;
        }
    }

    /**
     * Clean up expired payment requests
     * @returns {Promise<number>} Number of cleaned up requests
     */
    async cleanupExpiredRequests() {
        try {
            const result = await PaymentRequest.deleteMany({
                status: 'PENDING',
                expiresAt: { $lt: new Date() }
            });

            console.log(`Cleaned up ${result.deletedCount} expired payment requests`);
            return result.deletedCount;

        } catch (error) {
            console.error('Error cleaning up expired requests:', error.message);
            return 0;
        }
    }
}

module.exports = PaymentService;
