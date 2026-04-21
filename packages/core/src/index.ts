import * as Crypto from './crypto';
import { BacchantCodec } from './bacchant';
import { AestheteCodec } from './aesthete';

export * from './bacchant';
export * from './aesthete';
export * from './constants';
export * from './crypto';

/**
 * Options for Cryptagram codec operations.
 */
export interface CodecOptions {
  /** The protocol version to use. */
  protocol: 'bacchant' | 'aesthete';
  /** Optional quality level (for encoding). */
  quality?: number;
}

/**
 * Detects if a browser ImageData object contains a Cryptagram payload.
 * Scans for 'bacchant' and 'aesthete' headers.
 * 
 * @param imageData The image data to scan.
 * @returns The name of the detected protocol, or null if none found.
 */
export async function detectCryptagram(imageData: ImageData): Promise<string | null> {
  if (new BacchantCodec().decode(imageData).payload !== null) return 'bacchant';
  if (new AestheteCodec().decode(imageData).payload !== null) return 'aesthete';
  return null;
}

/**
 * Decodes an image into its raw encrypted payload string.
 * 
 * @param imageData The image data to decode.
 * @returns The base64-encoded encrypted payload, or null if decoding fails.
 */
export async function decodeCryptagram(imageData: ImageData): Promise<string | null> {
  const bacchant = new BacchantCodec().decode(imageData);
  if (bacchant.payload !== null) return bacchant.payload;
  
  const aesthete = new AestheteCodec().decode(imageData);
  if (aesthete.payload !== null) return aesthete.payload;
  
  return null;
}

/**
 * Encrypts cleartext data using modern WebCrypto (AES-GCM).
 * 
 * @param plaintext The secret message or image data (base64) to encrypt.
 * @param password The user's decryption password.
 * @returns A structured encrypted payload object.
 */
export async function encryptPayload(plaintext: string, password: string): Promise<Crypto.EncryptedPayload> {
  return await Crypto.encrypt(plaintext, password);
}

/**
 * Decrypts a structured Cryptagram payload.
 * Supports modern AES-GCM (Version 2).
 * 
 * @param payload The encrypted payload object.
 * @param password The user's decryption password.
 * @returns The decrypted cleartext string.
 */
export async function decryptPayload(payload: Crypto.EncryptedPayload, password: string): Promise<string> {
  return await Crypto.decrypt(payload, password);
}
