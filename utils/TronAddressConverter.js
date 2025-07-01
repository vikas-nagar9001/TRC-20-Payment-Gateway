const crypto = require('crypto');

// Base58 alphabet used by TRON
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Simple Base58 encode function
 * @param {Buffer} buffer - Buffer to encode
 * @returns {string} Base58 encoded string
 */
function base58Encode(buffer) {
    let digits = [0];
    
    for (let i = 0; i < buffer.length; i++) {
        let carry = buffer[i];
        for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8;
            digits[j] = carry % 58;
            carry = Math.floor(carry / 58);
        }
        
        while (carry > 0) {
            digits.push(carry % 58);
            carry = Math.floor(carry / 58);
        }
    }
    
    // Convert leading zeros
    let leadingZeros = 0;
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
        leadingZeros++;
    }
    
    let result = '';
    for (let i = 0; i < leadingZeros; i++) {
        result += BASE58_ALPHABET[0];
    }
    
    for (let i = digits.length - 1; i >= 0; i--) {
        result += BASE58_ALPHABET[digits[i]];
    }
    
    return result;
}

/**
 * Simple Base58 decode function
 * @param {string} str - Base58 string to decode
 * @returns {Buffer} Decoded buffer
 */
function base58Decode(str) {
    let bytes = [0];
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const charIndex = BASE58_ALPHABET.indexOf(char);
        
        if (charIndex === -1) {
            throw new Error(`Invalid Base58 character: ${char}`);
        }
        
        let carry = charIndex;
        for (let j = 0; j < bytes.length; j++) {
            carry += bytes[j] * 58;
            bytes[j] = carry & 0xff;
            carry >>= 8;
        }
        
        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }
    
    // Convert leading zeros
    let leadingZeros = 0;
    for (let i = 0; i < str.length && str[i] === BASE58_ALPHABET[0]; i++) {
        leadingZeros++;
    }
    
    const result = Buffer.alloc(leadingZeros + bytes.length);
    for (let i = 0; i < leadingZeros; i++) {
        result[i] = 0;
    }
    
    for (let i = 0; i < bytes.length; i++) {
        result[leadingZeros + i] = bytes[bytes.length - 1 - i];
    }
    
    return result;
}

/**
 * Convert TRON hex address to Base58 format
 * @param {string} hexAddress - Hex address (41...)
 * @returns {string} Base58 address (T...)
 */
function hexToBase58(hexAddress) {
    try {
        // Remove '0x' prefix if present
        if (hexAddress.startsWith('0x')) {
            hexAddress = hexAddress.slice(2);
        }
        
        // Ensure the address starts with 41 for TRON mainnet
        if (!hexAddress.startsWith('41')) {
            throw new Error('Invalid TRON address: must start with 41');
        }
        
        // Convert hex to buffer
        const addressBuffer = Buffer.from(hexAddress, 'hex');
        
        // Calculate double SHA256 checksum
        const hash1 = crypto.createHash('sha256').update(addressBuffer).digest();
        const hash2 = crypto.createHash('sha256').update(hash1).digest();
        
        // Take first 4 bytes as checksum
        const checksum = hash2.slice(0, 4);
        
        // Combine address and checksum
        const addressWithChecksum = Buffer.concat([addressBuffer, checksum]);
        
        // Encode to Base58
        return base58Encode(addressWithChecksum);
        
    } catch (error) {
        console.error('Error converting hex to Base58:', error.message);
        throw new Error(`Failed to convert address: ${error.message}`);
    }
}

/**
 * Convert TRON Base58 address to hex format
 * @param {string} base58Address - Base58 address (T...)
 * @returns {string} Hex address (41...)
 */
function base58ToHex(base58Address) {
    try {
        // Decode Base58
        const decoded = base58Decode(base58Address);
        
        // Extract address (all bytes except last 4)
        const address = decoded.slice(0, -4);
        const checksum = decoded.slice(-4);
        
        // Verify checksum
        const hash1 = crypto.createHash('sha256').update(address).digest();
        const hash2 = crypto.createHash('sha256').update(hash1).digest();
        const expectedChecksum = hash2.slice(0, 4);
        
        if (!checksum.equals(expectedChecksum)) {
            throw new Error('Invalid address checksum');
        }
        
        // Return hex address
        return address.toString('hex');
        
    } catch (error) {
        console.error('Error converting Base58 to hex:', error.message);
        throw new Error(`Failed to convert address: ${error.message}`);
    }
}

/**
 * Check if an address is valid Base58 TRON address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
function isValidBase58Address(address) {
    try {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        // TRON addresses should start with 'T' and be around 34 characters
        if (!address.startsWith('T') || address.length !== 34) {
            return false;
        }
        
        // Try to convert and see if it works
        const hex = base58ToHex(address);
        return hex.startsWith('41') && hex.length === 42;
        
    } catch (error) {
        return false;
    }
}

/**
 * Check if an address is valid hex TRON address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
function isValidHexAddress(address) {
    try {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        // Remove 0x prefix if present
        const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
        
        // Should start with 41 and be 42 characters (21 bytes)
        return cleanAddress.startsWith('41') && 
               cleanAddress.length === 42 && 
               /^[0-9a-fA-F]+$/.test(cleanAddress);
        
    } catch (error) {
        return false;
    }
}

module.exports = {
    hexToBase58,
    base58ToHex,
    isValidBase58Address,
    isValidHexAddress
};
