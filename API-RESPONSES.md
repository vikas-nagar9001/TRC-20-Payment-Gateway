# TRC-20 Payment Gateway API Response Documentation

This document provides examples of API responses from TronGrid API for different types of TRON transactions.

## Table of Contents
- [TRX/Native Coin Transactions](#trx-native-coin-transactions)
- [TRC-20 Token Transactions](#trc-20-token-transactions)
- [Data Decoding](#data-decoding)
- [Implementation Notes](#implementation-notes)

---

## TRX/Native Coin Transactions

### API Endpoint
```
GET https://api.trongrid.io/wallet/gettransactionbyid
```

### Response Structure
When querying transactions for **TRX or native coins**, the response includes:

```json
{
    "ret": [
        {
            "contractRet": "SUCCESS"
        }
    ],
    "signature": [
        "318a168653bcfad326aec59f47244b993877fcf86b958f2ccf0703b0f0f78bcd4c15adfc8513b69dd0080554757016c6d981da7bed3286f503b7210680f43abc01"
    ],
    "txID": "6adc5b544de4dc0f7ba94b5c0a10004aeb7359a517f2fe409445b24f89419b02",
    "raw_data": {
        "contract": [
            {
                "parameter": {
                    "value": {
                        "amount": 30000000,
                        "owner_address": "4119ffc904ab2e54fa4f54ffdb1cafd89a44170044",
                        "to_address": "415b84403715b218b869b2e008117a1bbda850e726"
                    },
                    "type_url": "type.googleapis.com/protocol.TransferContract"
                },
                "type": "TransferContract"
            }
        ],
        "ref_block_bytes": "edc8",
        "ref_block_hash": "130f70b0c59f4871",
        "expiration": 1751041604622,
        "fee_limit": 15000000,
        "timestamp": 1751041488000
    },
    "raw_data_hex": "0a02edc82208130f70b0c59f4871408ef8d991fb325a68080112640a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412330a154119ffc904ab2e54fa4f54ffdb1cafd89a441700441215415b84403715b218b869b2e008117a1bbda850e726188087a70e7080e9d291fb329001c0c39307"
}
```

### Key Fields for TRX Transactions

| Field Path | Description | Example Value | Notes |
|------------|-------------|---------------|-------|
| `ret[0].contractRet` | Transaction status | `"SUCCESS"` | Always check this for success |
| `txID` | Transaction ID | `"6adc5b544de4dc0f7ba94b5c0a10004aeb7359a517f2fe409445b24f89419b02"` | Unique transaction identifier |
| `raw_data.contract[0].type` | Contract type | `"TransferContract"` | Indicates TRX transfer |
| `raw_data.contract[0].parameter.value.amount` | Amount in SUN | `30000000` | 30 TRX (1 TRX = 1,000,000 SUN) |
| `raw_data.contract[0].parameter.value.owner_address` | Sender address (hex) | `"4119ffc904ab2e54fa4f54ffdb1cafd89a44170044"` | From address in hex format |
| `raw_data.contract[0].parameter.value.to_address` | Receiver address (hex) | `"415b84403715b218b869b2e008117a1bbda850e726"` | To address in hex format |
| `raw_data.timestamp` | Transaction timestamp | `1751041488000` | Unix timestamp in milliseconds |

---

## TRC-20 Token Transactions

### API Endpoint
```
GET https://api.trongrid.io/wallet/gettransactionbyid
```

### Response Structure
When querying transactions for **TRC-20 tokens** (USDT, USDC, etc.), the response includes:

```json
{
    "ret": [
        {
            "contractRet": "SUCCESS"
        }
    ],
    "signature": [
        "4bd57947ce504df9efb7c39035acd28daf7c3067c019ae0ff7d31db72dfa46fb7322ef28fddbe90115d6030d1995dc573498acf939fb815bb8a43c90285d421201"
    ],
    "txID": "f591b0c60730941e5a5fa09ded29993bbaab45ec91bef1a95fb6698876eb4729",
    "raw_data": {
        "contract": [
            {
                "parameter": {
                    "value": {
                        "data": "a9059cbb000000000000000000000000cb5f8073cedbb40ee156a6e5dc945c5cac067648000000000000000000000000000000000000000000000000000000000632ea00",
                        "owner_address": "41c53a7d3488cd47d41e72aeecd311efb4d64afb64",
                        "contract_address": "41a614f803b6fd780986a42c78ec9c7f77e6ded13c"
                    },
                    "type_url": "type.googleapis.com/protocol.TriggerSmartContract"
                },
                "type": "TriggerSmartContract"
            }
        ],
        "ref_block_bytes": "3921",
        "ref_block_hash": "412eb04792ea9688",
        "expiration": 1751296149000,
        "fee_limit": 100000000,
        "timestamp": 1751296090669
    },
    "raw_data_hex": "0a0239212208412eb04792ea968840888c8a8bfc325aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541c53a7d3488cd47d41e72aeecd311efb4d64afb64121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb000000000000000000000000cb5f8073cedbb40ee156a6e5dc945c5cac067648000000000000000000000000000000000000000000000000000000000632ea0070adc4868bfc32900180c2d72f"
}
```

### Key Fields for TRC-20 Token Transactions

| Field Path | Description | Example Value | Notes |
|------------|-------------|---------------|-------|
| `ret[0].contractRet` | Transaction status | `"SUCCESS"` | Always check this for success |
| `txID` | Transaction ID | `"f591b0c60730941e5a5fa09ded29993bbaab45ec91bef1a95fb6698876eb4729"` | Unique transaction identifier |
| `raw_data.contract[0].type` | Contract type | `"TriggerSmartContract"` | Indicates smart contract interaction |
| `raw_data.contract[0].parameter.value.data` | **Encoded transaction data** | `"a9059cbb000000000000000000000000cb5f8073..."` | Contains transfer details (needs decoding) |
| `raw_data.contract[0].parameter.value.owner_address` | Sender address (hex) | `"41c53a7d3488cd47d41e72aeecd311efb4d64afb64"` | From address in hex format |
| `raw_data.contract[0].parameter.value.contract_address` | Token contract address | `"41a614f803b6fd780986a42c78ec9c7f77e6ded13c"` | USDT contract address |
| `raw_data.timestamp` | Transaction timestamp | `1751296090669` | Unix timestamp in milliseconds |

---

## Data Decoding

### TRC-20 Data Field Structure
The `data` field in TRC-20 transactions contains encoded information:

```
a9059cbb000000000000000000000000cb5f8073cedbb40ee156a6e5dc945c5cac067648000000000000000000000000000000000000000000000000000000000632ea00
```

**Breakdown:**
- **First 8 characters**: `a9059cbb` - Function selector for `transfer(address,uint256)`
- **Next 64 characters**: `000000000000000000000000cb5f8073cedbb40ee156a6e5dc945c5cac067648` - Recipient address (padded)
- **Last 64 characters**: `000000000000000000000000000000000000000000000000000000000632ea00` - Transfer amount (hex)

### JavaScript Decoder Function

```javascript
/**
 * Decodes TRC-20 transaction data field
 * @param {string} data - The encoded data from the transaction
 * @returns {Object} Decoded transaction information
 */
function decodeTRC20Data(data) {
    // Validate that this is a standard TRC-20 transfer
    if (!data.startsWith('a9059cbb')) {
        throw new Error('Not a standard TRC20 transfer function');
    }

    // Extract function selector (first 8 characters)
    const method = data.slice(0, 8); // 'a9059cbb'
    
    // Extract recipient address (next 64 characters)
    const toHex = data.slice(8, 72);
    
    // Extract amount (remaining 64 characters)
    const amountHex = data.slice(72);

    // Convert recipient address to TRON format
    // Take last 40 hex characters (20 bytes) and prepend '41'
    const toAddress = '41' + toHex.slice(24);

    // Convert hex amount to decimal
    const amount = BigInt('0x' + amountHex).toString();

    return {
        method: method,
        toAddress: toAddress,
        amount: amount, // Amount in smallest unit (e.g., for USDT: 1 USDT = 1,000,000 units)
        methodName: 'transfer'
    };
}
```

### Example Usage

```javascript
// Example TRC-20 data
const data = "a9059cbb000000000000000000000000cb5f8073cedbb40ee156a6e5dc945c5cac067648000000000000000000000000000000000000000000000000000000000632ea00";

const decoded = decodeTRC20Data(data);
console.log(decoded);

// Output:
// {
//   method: 'a9059cbb',
//   toAddress: '41cb5f8073cedbb40ee156a6e5dc945c5cac067648',
//   amount: '103800000', // 103.8 USDT (if 6 decimals)
//   methodName: 'transfer'
// }
```

---

## Implementation Notes

### 1. Transaction Status Validation
Always check `ret[0].contractRet` for transaction success:
```javascript
if (response.ret[0].contractRet !== 'SUCCESS') {
    throw new Error('Transaction failed');
}
```

### 2. Address Format Conversion
- **API Response**: Addresses are in hex format (e.g., `41cb5f8073cedbb40ee156a6e5dc945c5cac067648`)
- **Display Format**: Convert to Base58 format (e.g., `TJK6vTviYJ468yfUC3vGzRoZtSvY72rYbM`)

### 3. Amount Handling
- **TRX**: Amount is in SUN (1 TRX = 1,000,000 SUN)
- **TRC-20 Tokens**: Amount depends on token decimals
  - USDT: 6 decimals (1 USDT = 1,000,000 units)
  - USDC: 6 decimals (1 USDC = 1,000,000 units)

### 4. Error Handling
```javascript
try {
    const decoded = decodeTRC20Data(data);
    // Process decoded data
} catch (error) {
    console.error('Failed to decode TRC-20 data:', error.message);
    // Handle error appropriately
}
```

### 5. Alternative Decoding Methods
If the provided decoder doesn't work, you can:
- Use Web3.js ABI decoder
- Use TronWeb library's contract interaction methods
- Parse manually using hex-to-string conversion libraries

---

## Common Contract Addresses

| Token | Contract Address | Decimals |
|-------|------------------|----------|
| USDT | `41a614f803b6fd780986a42c78ec9c7f77e6ded13c` | 6 |
| USDC | `41b8ae8b62f2a4cc78e3f66c45b5acfedb924fd2a6` | 6 |

---

## Troubleshooting

### Common Issues:
1. **Invalid function selector**: Ensure the data starts with `a9059cbb`
2. **Address conversion errors**: Verify hex address format before conversion
3. **Amount calculation**: Remember to account for token decimals
4. **Transaction failure**: Always check `contractRet` status

### Debug Tips:
- Log the raw response for inspection
- Validate data field length (should be 136 characters for standard transfers)
- Use blockchain explorers to verify transaction details
