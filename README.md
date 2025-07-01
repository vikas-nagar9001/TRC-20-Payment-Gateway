# TRC-20 Payment Gateway

A secure and user-friendly payment gateway for accepting TRC-20 tokens (USDT, TRX, USDC) on the TRON blockchain with automatic verification via TronGrid API.

## 🌟 Features

- ✅ Accept payments in TRX, USDT, and USDC (TRC-20)
- ✅ Real-time transaction verification via TronGrid API
- ✅ QR code generation for easy payments
- ✅ Automatic duplicate transaction prevention
- ✅ MongoDB storage for transaction history
- ✅ Modern, responsive web interface
- ✅ Rate limiting and security features
- ✅ Automatic cleanup of expired payment requests

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- A TRON wallet address for receiving payments

### Installation

1. **Clone or download the project:**
   ```powershell
   cd c:\Users\vikas\Documents\Crytpo
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Configure environment variables:**
   ```powershell
   copy .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/trc20_payments
   GATEWAY_WALLET_ADDRESS=TJK6vTviYJ468yfUC3vGzRoZtSvY72rYbM
   PORT=3000
   ```

4. **Start MongoDB:**
   Make sure MongoDB is running on your system.

5. **Run the application:**
   ```powershell
   npm start
   ```

6. **Access the gateway:**
   Open http://localhost:3000 in your browser

## 📱 How to Use

### For Users (Making Payments)

1. **Create Payment Request:**
   - Enter the amount you want to pay
   - Select token type (TRX, USDT, USDC)
   - Click "Create Payment Request"

2. **Make Payment:**
   - Scan the QR code with your TRON wallet
   - OR copy the address and send manually
   - Send the exact amount shown

3. **Verify Payment:**
   - Copy your transaction ID (TXID) from your wallet
   - Paste it into the verification field
   - Click "Verify Payment"

4. **Confirmation:**
   - View your transaction details
   - Payment is recorded in the system

### For Developers (API Usage)

#### Create Payment Request
```javascript
POST /api/payment/create
Content-Type: application/json

{
  "amount": "10.5",
  "tokenType": "USDT"
}
```

#### Verify Payment
```javascript
POST /api/payment/verify
Content-Type: application/json

{
  "txid": "transaction_id_here",
  "requestId": "request_id_from_create_response"
}
```

#### Get Transaction History
```javascript
GET /api/payment/history?page=1&limit=20
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/trc20_payments` |
| `GATEWAY_WALLET_ADDRESS` | Your TRON wallet address | `TJK6vTviYJ468yfUC3vGzRoZtSvY72rYbM` |
| `PORT` | Server port | `3000` |
| `PAYMENT_TIMEOUT_MINUTES` | Payment request expiration | `30` |
| `USDT_CONTRACT_ADDRESS` | USDT TRC-20 contract | `41a614f803b6fd780986a42c78ec9c7f77e6ded13c` |
| `USDC_CONTRACT_ADDRESS` | USDC TRC-20 contract | `41b8ae8b62f2a4cc78e3f66c45b5acfedb924fd2a6` |

### Supported Tokens

- **TRX** - Native TRON token (6 decimals)
- **USDT** - Tether USD TRC-20 (6 decimals)
- **USDC** - USD Coin TRC-20 (6 decimals)

## 🏗️ Project Structure

```
trc20-payment-gateway/
├── models/
│   └── Transaction.js          # MongoDB schemas
├── services/
│   ├── TronGridService.js      # TronGrid API integration
│   └── PaymentService.js       # Payment processing logic
├── routes/
│   └── payment.js              # API endpoints
├── public/
│   └── index.html              # Frontend interface
├── server.js                   # Main server file
├── package.json                # Dependencies
└── .env                        # Environment configuration
```

## 🔐 Security Features

- **Rate Limiting:** Prevents API abuse
- **Input Validation:** Validates all user inputs
- **Duplicate Prevention:** Prevents reuse of transaction IDs
- **Address Validation:** Ensures payments go to correct address
- **Amount Verification:** Verifies exact amounts
- **Timeout Protection:** Payment requests expire automatically

## 🔄 Transaction Flow

1. **User Request:** User creates payment request with amount and token type
2. **QR Generation:** System generates QR code and payment details
3. **User Payment:** User sends payment from their wallet
4. **Verification:** System verifies transaction via TronGrid API
5. **Validation:** Checks recipient, amount, and transaction status
6. **Storage:** Stores verified transaction in MongoDB
7. **Confirmation:** Shows success page with transaction details

## 📊 API Endpoints

### Payment Endpoints
- `POST /api/payment/create` - Create payment request
- `POST /api/payment/verify` - Verify transaction
- `GET /api/payment/request/:requestId` - Get payment request details
- `GET /api/payment/history` - Get transaction history
- `GET /api/payment/tokens` - Get supported tokens
- `GET /api/payment/health` - Health check

### Health Check
- `GET /health` - Server health status

## 🛠️ Development

### Running in Development Mode
```powershell
npm run dev
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🚀 Production Deployment

1. **Set environment to production:**
   ```env
   NODE_ENV=production
   ```

2. **Configure CORS for your domain:**
   Update `server.js` CORS configuration

3. **Use process manager:**
   ```powershell
   npm install -g pm2
   pm2 start server.js --name "trc20-gateway"
   ```

4. **Set up reverse proxy** (nginx/apache)

5. **Enable HTTPS** for security

## 🔍 Monitoring

The application provides:
- Health check endpoint at `/health`
- Automatic cleanup of expired requests
- Error logging and handling
- Transaction history tracking

## ⚠️ Important Notes

1. **Test Thoroughly:** Always test with small amounts first
2. **Backup Database:** Regular MongoDB backups recommended
3. **Monitor Logs:** Check server logs for any issues
4. **Update Contracts:** Keep token contract addresses updated
5. **Security:** Never expose private keys or sensitive data

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **TronGrid API Errors:**
   - Check internet connection
   - Verify TronGrid service status

3. **Transaction Not Found:**
   - Wait for blockchain confirmation
   - Check transaction ID format

4. **Address Mismatch:**
   - Verify wallet address in `.env`
   - Ensure correct network (mainnet)

## 📄 License

This project is open source. Feel free to use and modify according to your needs.

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify environment configuration
4. Test with known working transactions
