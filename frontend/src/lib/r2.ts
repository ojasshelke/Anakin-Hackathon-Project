import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Upload a buffer to Cloudflare R2.
 *
 * Returns `null` (never throws) when R2 is not configured or the upload fails,
 * so callers can transparently fall back to a base64 data URL.
 */
export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string,
): Promise<string | null> {
  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || 'vexa-assets';
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !publicUrlBase) {
      console.warn('[r2] Skipping upload: R2 is not fully configured');
      return null;
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: file,
        ContentType: contentType,
      }),
    );

    const base = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
    return `${base}/${filename}`;
  } catch (err) {
    console.warn('[r2] Upload failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
