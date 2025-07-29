// Simple encryption using built-in crypto
import * as Crypto from 'expo-crypto';

// Generate a random key for encryption
export const generateEncryptionKey = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Generate RSA key pair for E2E encryption
export const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  // For simplicity, we'll use a symmetric approach with shared keys
  // In a production app, you'd want to use proper RSA key generation
  const keyPair = await generateEncryptionKey();
  return {
    publicKey: keyPair,
    privateKey: keyPair,
  };
};

// Helper function to convert string to UTF-8 bytes (React Native compatible)
const stringToUtf8Bytes = (str: string): number[] => {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      // Surrogate pair
      i++;
      const hi = code;
      const lo = str.charCodeAt(i);
      const codePoint = 0x10000 + (((hi & 0x3ff) << 10) | (lo & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }
  return bytes;
};

// Helper function to convert UTF-8 bytes to string (React Native compatible)
const utf8BytesToString = (bytes: number[]): string => {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else if ((byte1 >> 5) === 0x06) {
      const byte2 = bytes[i++];
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else if ((byte1 >> 4) === 0x0e) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      result += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
    } else if ((byte1 >> 3) === 0x1e) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      const byte4 = bytes[i++];
      const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
      const hi = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
      const lo = ((codePoint - 0x10000) % 0x400) + 0xdc00;
      result += String.fromCharCode(hi, lo);
    }
  }
  return result;
};

// Simple XOR encryption with proper Unicode support (React Native compatible)
export const encryptMessage = (message: string, key: string): string => {
  try {
    // Convert message and key to UTF-8 bytes
    const messageBytes = stringToUtf8Bytes(message);
    const keyBytes = stringToUtf8Bytes(key);

    // XOR encryption
    const encrypted: number[] = [];
    for (let i = 0; i < messageBytes.length; i++) {
      encrypted[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert to base64
    const binaryString = encrypted.map(byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Simple XOR decryption with proper Unicode support (React Native compatible)
export const decryptMessage = (encryptedMessage: string, key: string): string => {
  try {
    // Base64 decode first
    const binaryString = atob(encryptedMessage);
    const encrypted: number[] = [];
    for (let i = 0; i < binaryString.length; i++) {
      encrypted[i] = binaryString.charCodeAt(i);
    }

    // XOR decryption
    const keyBytes = stringToUtf8Bytes(key);
    const decrypted: number[] = [];
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert back to UTF-8 string
    return utf8BytesToString(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

// Generate a shared encryption key for a chat room
export const generateChatRoomKey = async (userId1: string, userId2: string): Promise<string> => {
  // Create a deterministic key based on user IDs
  const combinedIds = [userId1, userId2].sort().join('');
  // Simple hash function for demo
  let hash = 0;
  for (let i = 0; i < combinedIds.length; i++) {
    const char = combinedIds.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

// Encrypt data for storage
export const encryptData = (data: any, key: string): string => {
  const jsonString = JSON.stringify(data);
  return encryptMessage(jsonString, key);
};

// Decrypt data from storage
export const decryptData = (encryptedData: string, key: string): any => {
  const decryptedString = decryptMessage(encryptedData, key);
  return JSON.parse(decryptedString);
};

// Key derivation for secure key generation
export const deriveKey = async (password: string, salt: string): Promise<string> => {
  try {
    // Simple key derivation for demo
    const combined = password + salt;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error('Failed to derive key');
  }
};

// Generate salt for key derivation
export const generateSalt = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure key storage utilities
export const generateSecureKey = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Encrypt file data (simplified)
export const encryptFile = async (fileData: ArrayBuffer, key: string): Promise<string> => {
  try {
    const uint8Array = new Uint8Array(fileData);
    const dataString = Array.from(uint8Array).join(',');
    return encryptMessage(dataString, key);
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
};

// Decrypt file data (simplified)
export const decryptFile = (encryptedData: string, key: string): ArrayBuffer => {
  try {
    const decryptedString = decryptMessage(encryptedData, key);
    const dataArray = decryptedString.split(',').map(Number);
    return new Uint8Array(dataArray).buffer;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
};

// Message integrity verification (simplified)
export const createMessageHash = (message: string, key: string): string => {
  const combined = message + key;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export const verifyMessageHash = (message: string, hash: string, key: string): boolean => {
  const computedHash = createMessageHash(message, key);
  return computedHash === hash;
};
