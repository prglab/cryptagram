/**
 * Cryptagram Shared Core (TypeScript)
 */

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
export async function detectCryptagram(image: HTMLImageElement | ImageData): Promise<string | null> {
  // TODO: Port detect_codec logic from tests/harness/codec_util.py
  return null;
}

/**
 * Decodes an image into an encrypted payload.
 */
export async function decodeCryptagram(image: HTMLImageElement | ImageData): Promise<EncryptedPayload | null> {
  // TODO: Port decode logic
  return null;
}

/**
 * Encrypts cleartext data for embedding.
 */
export async function encryptPayload(plaintext: string, password: string): Promise<EncryptedPayload> {
  // TODO: Implement modern WebCrypto-based encryption (AES-GCM)
  throw new Error('Not implemented');
}
