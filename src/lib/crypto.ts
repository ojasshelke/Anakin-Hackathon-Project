/**
 * crypto.ts
 * Shared cryptographic utilities for VEXA.
 */

/**
 * SHA-256 hash of the raw API key.
 * Only the hash is stored in the DB — the raw key is never persisted.
 */
export async function hashApiKey(rawKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
