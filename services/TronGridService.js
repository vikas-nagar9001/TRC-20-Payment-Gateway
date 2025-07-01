const axios = require('axios');
const { hexToBase58, base58ToHex, isValidBase58Address, isValidHexAddress } = require('../utils/TronAddressConverter');

class TronGridService {
    constructor() {
        this.baseURL = process.env.TRONGRID_API_URL || 'https://api.trongrid.io';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Get transaction details by transaction ID
     * @param {string} txid - Transaction ID
     * @returns {Promise<Object>} Transaction details
     */
    async getTransactionById(txid) {
        try {
            const response = await this.client.post('/wallet/gettransactionbyid', {
                value: txid
            });
            
            return response.data;
        } catch (error) {
            console.error('Error fetching transaction:', error.message);
            throw new Error(`Failed to fetch transaction: ${error.message}`);
        }
    }

    /**
     * Decode TRC-20 token transfer data
     * @param {string} data - Hex data from smart contract call
     * @returns {Object} Decoded transfer details
     */
    decodeTRC20Data(data) {
        try {
            // Check if it's a standard TRC-20 transfer function (method signature: a9059cbb)
            if (!data.startsWith('a9059cbb')) {
                throw new Error('Not a standard TRC-20 transfer function');
            }

            const method = data.slice(0, 8); // 'a9059cbb'
            const toHex = data.slice(8, 72); // 64 characters for address
            const amountHex = data.slice(72); // remaining 64 characters for amount

            // Extract recipient address (last 40 hex chars = 20 bytes)
            // TRON addresses are 21 bytes and start with '41'
            const toAddress = '41' + toHex.slice(24);

            // Convert hex to decimal amount
            const amount = BigInt('0x' + amountHex).toString();

            return {
                method,
                toAddress,
                amount
            };
        } catch (error) {
            console.error('Error decoding TRC-20 data:', error.message);
            throw new Error(`Failed to decode TRC-20 data: ${error.message}`);
        }
    }

    /**
     * Convert TRON hex address to base58 format
     * @param {string} hexAddress - Hex address (41...)
     * @returns {string} Base58 address (T...)
     */
    hexToBase58(hexAddress) {
        return hexToBase58(hexAddress);
    }

    /**
     * Convert TRON base58 address to hex format
     * @param {string} base58Address - Base58 address (T...)
     * @returns {string} Hex address (41...)
     */
    base58ToHex(base58Address) {
        return base58ToHex(base58Address);
    }

    /**
     * Verify a transaction meets payment criteria
     * @param {string} txid - Transaction ID
     * @param {string} expectedToAddress - Expected recipient address
     * @param {string} expectedAmount - Expected amount (in smallest units)
     * @param {string} tokenType - Token type (TRX, USDT, etc.)
     * @param {string} contractAddress - Token contract address (null for TRX)
     * @returns {Promise<Object>} Verification result
     */
    async verifyTransaction(txid, expectedToAddress, expectedAmount, tokenType, contractAddress = null) {
        try {
            const txData = await this.getTransactionById(txid);
            
            // Check if transaction exists and was successful
            if (!txData || !txData.ret || txData.ret[0].contractRet !== 'SUCCESS') {
                return {
                    valid: false,
                    error: 'Transaction not found or failed',
                    details: null
                };
            }

            // Check if txID matches
            if (txData.txID !== txid) {
                return {
                    valid: false,
                    error: 'Transaction ID mismatch',
                    details: null
                };
            }

            const contract = txData.raw_data.contract[0];
            let fromAddress, toAddress, amount, actualTokenType, actualContractAddress;

            // Handle native TRX transfers
            if (contract.type === 'TransferContract') {
                const transferData = contract.parameter.value;
                fromAddress = transferData.owner_address;
                toAddress = transferData.to_address;
                amount = transferData.amount.toString();
                actualTokenType = 'TRX';
                actualContractAddress = null;
            }
            // Handle TRC-20 token transfers
            else if (contract.type === 'TriggerSmartContract') {
                const contractData = contract.parameter.value;
                fromAddress = contractData.owner_address;
                actualContractAddress = contractData.contract_address;
                
                // Decode the smart contract data
                const decodedData = this.decodeTRC20Data(contractData.data);
                toAddress = decodedData.toAddress;
                amount = decodedData.amount;
                
                // Determine token type based on contract address
                actualTokenType = this.getTokenTypeByContract(actualContractAddress);
            } else {
                return {
                    valid: false,
                    error: 'Unsupported transaction type',
                    details: null
                };
            }

            // Verify the transaction details
            const verificationErrors = [];

            // Normalize addresses for comparison
            let normalizedToAddress, normalizedExpectedAddress, normalizedFromAddress;
            
            try {
                // Convert hex addresses to Base58 for comparison if needed
                if (isValidHexAddress(toAddress)) {
                    normalizedToAddress = this.hexToBase58(toAddress);
                } else if (isValidBase58Address(toAddress)) {
                    normalizedToAddress = toAddress;
                } else {
                    verificationErrors.push(`Invalid recipient address format: ${toAddress}`);
                    normalizedToAddress = toAddress;
                }

                // Ensure expected address is in Base58 format
                if (isValidHexAddress(expectedToAddress)) {
                    normalizedExpectedAddress = this.hexToBase58(expectedToAddress);
                } else if (isValidBase58Address(expectedToAddress)) {
                    normalizedExpectedAddress = expectedToAddress;
                } else {
                    verificationErrors.push(`Invalid expected address format: ${expectedToAddress}`);
                    normalizedExpectedAddress = expectedToAddress;
                }

                // Convert from address for self-payment check
                if (isValidHexAddress(fromAddress)) {
                    normalizedFromAddress = this.hexToBase58(fromAddress);
                } else if (isValidBase58Address(fromAddress)) {
                    normalizedFromAddress = fromAddress;
                } else {
                    normalizedFromAddress = fromAddress;
                }

            } catch (conversionError) {
                verificationErrors.push(`Address conversion error: ${conversionError.message}`);
                normalizedToAddress = toAddress;
                normalizedExpectedAddress = expectedToAddress;
                normalizedFromAddress = fromAddress;
            }

            // Check recipient address
            if (normalizedToAddress.toLowerCase() !== normalizedExpectedAddress.toLowerCase()) {
                verificationErrors.push(`Recipient address mismatch. Expected: ${normalizedExpectedAddress}, Got: ${normalizedToAddress}`);
            }

            // Check amount
            if (amount !== expectedAmount) {
                verificationErrors.push(`Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}`);
            }

            // Check token type
            if (actualTokenType !== tokenType) {
                verificationErrors.push(`Token type mismatch. Expected: ${tokenType}, Got: ${actualTokenType}`);
            }

            // Check contract address for tokens
            if (contractAddress && actualContractAddress !== contractAddress) {
                verificationErrors.push(`Contract address mismatch. Expected: ${contractAddress}, Got: ${actualContractAddress}`);
            }

            // Check that sender is not the same as recipient (prevent self-payments)
            if (normalizedFromAddress.toLowerCase() === normalizedExpectedAddress.toLowerCase()) {
                verificationErrors.push('Self-payment detected');
            }

            const isValid = verificationErrors.length === 0;

            return {
                valid: isValid,
                error: isValid ? null : verificationErrors.join('; '),
                details: {
                    txid,
                    fromAddress: normalizedFromAddress,
                    toAddress: normalizedToAddress,
                    amount,
                    tokenType: actualTokenType,
                    contractAddress: actualContractAddress,
                    timestamp: txData.raw_data.timestamp,
                    blockNumber: null // TronGrid doesn't return block number in this call
                }
            };

        } catch (error) {
            console.error('Error verifying transaction:', error.message);
            return {
                valid: false,
                error: `Verification failed: ${error.message}`,
                details: null
            };
        }
    }

    /**
     * Get token type by contract address
     * @param {string} contractAddress - Contract address
     * @returns {string} Token type
     */
    getTokenTypeByContract(contractAddress) {
        const knownContracts = {
            '41a614f803b6fd780986a42c78ec9c7f77e6ded13c': 'USDT', // USDT TRC-20
            '41b8ae8b62f2a4cc78e3f66c45b5acfedb924fd2a6': 'USDC', // USDC TRC-20 (example)
        };

        return knownContracts[contractAddress.toLowerCase()] || 'OTHER';
    }

    /**
     * Get decimals for a token type
     * @param {string} tokenType - Token type
     * @returns {number} Number of decimals
     */
    getTokenDecimals(tokenType) {
        const decimals = {
            'TRX': 6,
            'USDT': 6,
            'USDC': 6,
            'OTHER': 6
        };

        return decimals[tokenType] || 6;
    }

    /**
     * Convert amount from smallest units to human readable format
     * @param {string} amount - Amount in smallest units
     * @param {number} decimals - Number of decimals
     * @returns {string} Human readable amount
     */
    formatAmount(amount, decimals) {
        const divisor = BigInt(10 ** decimals);
        const wholePart = BigInt(amount) / divisor;
        const fractionalPart = BigInt(amount) % divisor;
        
        if (fractionalPart === 0n) {
            return wholePart.toString();
        }
        
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        const trimmedFractional = fractionalStr.replace(/0+$/, '');
        
        return `${wholePart}.${trimmedFractional}`;
    }

    /**
     * Convert human readable amount to smallest units
     * @param {string} amount - Human readable amount
     * @param {number} decimals - Number of decimals
     * @returns {string} Amount in smallest units
     */
    parseAmount(amount, decimals) {
        const multiplier = BigInt(10 ** decimals);
        const [wholePart, fractionalPart = ''] = amount.toString().split('.');
        
        const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
        const wholePartBig = BigInt(wholePart);
        const fractionalPartBig = BigInt(paddedFractional);
        
        return (wholePartBig * multiplier + fractionalPartBig).toString();
    }
}

module.exports = TronGridService;
