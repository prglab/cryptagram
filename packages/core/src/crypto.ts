/**
 * Cryptagram Crypto Module
 * Uses WebCrypto (AES-GCM) for modern encryption.
 */

export interface EncryptedPayload {
  version: number;
  protocol: string;
  ciphertext: string; // Base64
  iv: string;        // Base64
  salt: string;      // Base64
  tag?: string;      // Base64 (for AES-GCM)
}

const ITERATIONS = 100000;
const KEY_LEN = 256;
const SALT_LEN = 16;
const IV_LEN = 12;

/**
 * Derives a key from a password and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2' as any,
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LEN },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts cleartext using AES-GCM.
 */
export async function encrypt(plaintext: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv } as any,
    key,
    enc.encode(plaintext)
  );

  const buffer = new Uint8Array(encrypted);
  const ciphertext = buffer.slice(0, -16);
  const tag = buffer.slice(-16);

  return {
    version: 2,
    protocol: 'aes-gcm',
    ciphertext: btoa(String.fromCharCode(...ciphertext)),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    tag: btoa(String.fromCharCode(...tag))
  };
}

/**
 * Decrypts a payload using AES-GCM.
 */
export async function decrypt(payload: EncryptedPayload, password: string): Promise<string> {
  if (payload.version === 1) {
    throw new Error('Legacy AES-CCM decryption not yet implemented in WebCrypto core.');
  }
  
  if (payload.version !== 2) {
    throw new Error(`Unsupported payload version: ${payload.version}`);
  }

  const salt = Uint8Array.from(atob(payload.salt), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(payload.ciphertext), c => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(payload.tag!), c => c.charCodeAt(0));

  const key = await deriveKey(password, salt);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv } as any,
    key,
    combined
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Parses a legacy (Version 1) payload string.
 */
export function parseLegacyPayload(data: string, protocol: string): EncryptedPayload {
  if (protocol === 'bacchant') {
    const iv = data.substring(32, 54);
    const salt = data.substring(54, 65);
    const ciphertext = data.substring(65);
    return { version: 1, protocol: 'aes-ccm', ciphertext, iv, salt };
  } else if (protocol === 'aesthete') {
    const iv = data.substring(64, 86);
    const salt = data.substring(86, 97);
    const ciphertext = data.substring(97);
    return { version: 1, protocol: 'aes-ccm', ciphertext, iv, salt };
  }
  throw new Error(`Unknown legacy protocol: ${protocol}`);
}
