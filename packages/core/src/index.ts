import { BacchantCodec } from './bacchant';
import { AestheteCodec } from './aesthete';

export * from './bacchant';
export * from './aesthete';
export * from './constants';

export interface CodecOptions {
  protocol: 'bacchant' | 'aesthete';
  quality?: number;
}

export interface EncryptedPayload {
  version: number;
  protocol: string;
  ciphertext: string;
  salt: string;
  iv: string;
}

/**
 * Detects if an image contains a Cryptagram payload.
 */
export async function detectCryptagram(imageData: ImageData): Promise<string | null> {
  if (new BacchantCodec().decode(imageData).payload !== null) return 'bacchant';
  if (new AestheteCodec().decode(imageData).payload !== null) return 'aesthete';
  return null;
}

/**
 * Decodes an image into an encrypted payload.
 */
export async function decodeCryptagram(imageData: ImageData): Promise<string | null> {
  const bacchant = new BacchantCodec().decode(imageData);
  if (bacchant.payload !== null) return bacchant.payload;
  
  const aesthete = new AestheteCodec().decode(imageData);
  if (aesthete.payload !== null) return aesthete.payload;
  
  return null;
}

/**
 * Encrypts cleartext data for embedding.
 */
export async function encryptPayload(plaintext: string, password: string): Promise<EncryptedPayload> {
  // TODO: Implement modern WebCrypto-based encryption (AES-GCM)
  throw new Error('Not implemented');
}
