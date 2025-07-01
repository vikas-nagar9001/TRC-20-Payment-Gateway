const express = require('express');
const PaymentService = require('../services/PaymentService');
const QRCode = require('qrcode');

const router = express.Router();
const paymentService = new PaymentService();

/**
 * Create a new payment request
 * POST /api/payment/create
 */
router.post('/create', async (req, res) => {
    try {
        const { amount, tokenType = 'USDT' } = req.body;

        // Validate input
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount provided'
            });
        }

        if (!['TRX', 'USDT', 'USDC', 'OTHER'].includes(tokenType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token type'
            });
        }

        const metadata = {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
        };

        const paymentRequest = await paymentService.createPaymentRequest(
            amount,
            tokenType,
            metadata
        );

        // Generate QR code
        const qrCodeDataURL = await QRCode.toDataURL(paymentRequest.qrCodeData, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        res.json({
            success: true,
            data: {
                ...paymentRequest,
                qrCodeImage: qrCodeDataURL
            }
        });

    } catch (error) {
        console.error('Create payment error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment request'
        });
    }
});

/**
 * Verify a transaction
 * POST /api/payment/verify
 */
router.post('/verify', async (req, res) => {
    try {
        const { txid, requestId } = req.body;

        // Validate input
        if (!txid || typeof txid !== 'string' || txid.length !== 64) {
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction ID'
            });
        }

        if (!requestId || typeof requestId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request ID'
            });
        }

        const result = await paymentService.verifyPayment(txid, requestId);

        if (result.success) {
            res.json({
                success: true,
                message: 'Payment verified successfully',
                transaction: result.transaction
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                errorCode: result.errorCode
            });
        }

    } catch (error) {
        console.error('Verify payment error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to verify payment'
        });
    }
});

/**
 * Get payment request details
 * GET /api/payment/request/:requestId
 */
router.get('/request/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        const paymentRequest = await paymentService.getPaymentRequest(requestId);

        if (!paymentRequest) {
            return res.status(404).json({
                success: false,
                error: 'Payment request not found'
            });
        }

        res.json({
            success: true,
            data: paymentRequest
        });

    } catch (error) {
        console.error('Get payment request error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment request'
        });
    }
});

/**
 * Get transaction history
 * GET /api/payment/history
 */
router.get('/history', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items per page

        const history = await paymentService.getTransactionHistory(page, limit);

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Get transaction history error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get transaction history'
        });
    }
});

/**
 * Get supported tokens
 * GET /api/payment/tokens
 */
router.get('/tokens', (req, res) => {
    const supportedTokens = [
        {
            symbol: 'TRX',
            name: 'TRON',
            decimals: 6,
            contractAddress: null,
            isNative: true
        },
        {
            symbol: 'USDT',
            name: 'Tether USD (TRC-20)',
            decimals: 6,
            contractAddress: process.env.USDT_CONTRACT_ADDRESS,
            isNative: false
        },
        {
            symbol: 'USDC',
            name: 'USD Coin (TRC-20)',
            decimals: 6,
            contractAddress: process.env.USDC_CONTRACT_ADDRESS,
            isNative: false
        }
    ];

    res.json({
        success: true,
        data: supportedTokens
    });
});

/**
 * Health check endpoint
 * GET /api/payment/health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        service: 'TRC-20 Payment Gateway',
        version: '1.0.0'
    });
});

module.exports = router;
