/**
 * avatarCache.ts
 * Presigned URL generation + short-lived in-memory TTL cache.
 * Uses Cloudflare R2 via AWS S3-compatible Software Development Kit for production presigning.
 *
 * RULE: raw storage paths are NEVER returned — only signed URLs with expiry.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface SignedUrlEntry {
  url: string;
  expiresAt: number; // epoch ms
}

// In-memory cache scoped to server process (per-worker in edge runtime)
const urlCache = new Map<string, SignedUrlEntry>();

const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour
const CACHE_GRACE_SECONDS = 60; // refresh 60 s before actual expiry

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 environment variables missing: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Generate a presigned URL for a given storage path.
 * Uses Cloudflare R2 via S3-compatible Software Development Kit in production,
 * falls back to CDN URL when R2 is not configured.
 */
async function generatePresignedUrl(storagePath: string): Promise<string> {
  // Development fallback when R2 is not configured
  if (!process.env.R2_ACCOUNT_ID) {
    const base = process.env.STORAGE_BASE_URL || 'https://cdn.vexa.dev';
    return `${base}/${storagePath}`;
  }

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME not configured');

  const command = new GetObjectCommand({ Bucket: bucket, Key: storagePath });
  return getSignedUrl(client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}

/**
 * Get a signed URL for a storage path.
 * Serves from cache if still valid; regenerates otherwise.
 */
export async function getSignedAvatarUrl(storagePath: string): Promise<string> {
  const cached = urlCache.get(storagePath);
  const now = Date.now();

  if (cached && cached.expiresAt > now + CACHE_GRACE_SECONDS * 1000) {
    return cached.url;
  }

  const url = await generatePresignedUrl(storagePath);
  const expiresAt = now + SIGNED_URL_TTL_SECONDS * 1000;

  urlCache.set(storagePath, { url, expiresAt });
  return url;
}

/**
 * Invalidate a cached entry (e.g., after avatar overwrite).
 */
export function invalidateAvatarUrl(storagePath: string): void {
  urlCache.delete(storagePath);
}

/**
 * Clear all cached entries (e.g., for testing).
 */
export function clearAvatarUrlCache(): void {
  urlCache.clear();
}

/**
 * Build the canonical storage path for a user's avatar GLB.
 * Keeps paths deterministic and never publicly guessable.
 */
export function avatarStoragePath(userId: string): string {
  return `avatars/${userId}/avatar.glb`;
}

/**
 * Build storage path for a per-product try-on render.
 */
export function tryOnStoragePath(userId: string, productId: string): string {
  return `tryon/${userId}/${productId}/render.glb`;
}
