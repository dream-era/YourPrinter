/**
 * lib/storage/b2.ts
 *
 * Server-side Backblaze B2 storage abstraction using the S3-compatible API.
 *
 * SECURITY RULES — enforced here:
 * - This module is NEVER imported by client components.
 * - B2_KEY_ID and B2_APPLICATION_KEY are read exclusively from process.env;
 *   they are never passed to the browser.
 * - The B2 bucket is PRIVATE. All access is through short-lived signed URLs.
 * - Upload URLs expire in 15 minutes; download URLs expire in 5 minutes.
 *
 * Usage:
 *   import { buildObjectKey, getSignedUploadUrl, getSignedDownloadUrl, exists } from "@/lib/storage/b2";
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// Configuration — validated at first use, not at module load, so that Next.js
// can tree-shake this module out of client bundles (it never runs on the client).
// ---------------------------------------------------------------------------

function getB2Config() {
  const endpoint = process.env.B2_ENDPOINT;
  const region = process.env.B2_REGION || "us-east-005";
  const bucket = process.env.B2_BUCKET_NAME;
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;

  if (!endpoint || !bucket || !keyId || !appKey) {
    throw new Error(
      "Backblaze B2 is not configured. " +
        "Ensure B2_ENDPOINT, B2_BUCKET_NAME, B2_KEY_ID, and B2_APPLICATION_KEY " +
        "are set as server-side environment variables (never NEXT_PUBLIC_*)."
    );
  }

  return { endpoint, region, bucket, keyId, appKey };
}

// Singleton S3Client — created once per server process, never recreated per-request.
let _s3Client: S3Client | null = null;
let _bucket: string | null = null;

function getS3Client(): { client: S3Client; bucket: string } {
  if (_s3Client && _bucket) {
    return { client: _s3Client, bucket: _bucket };
  }

  const { endpoint, region, bucket, keyId, appKey } = getB2Config();

  _s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
    },
    // B2 requires path-style addressing (not virtual-hosted-style)
    forcePathStyle: true,
  });

  _bucket = bucket;
  return { client: _s3Client, bucket };
}

// ---------------------------------------------------------------------------
// Object key helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize a filename so it is safe to use as part of a storage key.
 * Strips path traversal characters, collapses spaces, limits length.
 */
function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[/\\:*?"<>|]/g, "_") // strip path-unsafe chars
    .replace(/\s+/g, "_")           // spaces → underscores
    .replace(/\.{2,}/g, ".")        // collapse double-dots (path traversal)
    .replace(/^\.+/, "")            // strip leading dots
    .slice(0, 200);                 // cap at 200 chars
}

/**
 * Build a collision-resistant, path-traversal-safe object key.
 *
 * Layout: shops/{shopId}/docs/{documentId}/{safeFilename}
 *
 * shopId and documentId are UUID v4 — they are verified by the API routes
 * before calling this function. The filename is sanitized here as a second
 * layer of defence.
 */
export function buildObjectKey(
  shopId: string,
  documentId: string,
  originalFilename: string
): string {
  const safe = sanitizeFilename(originalFilename);
  return `shops/${shopId}/docs/${documentId}/${safe}`;
}

// ---------------------------------------------------------------------------
// Core storage operations
// ---------------------------------------------------------------------------

export const UPLOAD_URL_EXPIRY_SECONDS = 900;   // 15 minutes
export const DOWNLOAD_URL_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Generate a short-lived pre-signed URL that the client can use to PUT a file
 * directly into B2, without the file touching Next.js server memory.
 *
 * The returned URL is a PUT URL. The client must set:
 *   Content-Type: <mimeType>
 * in the request.
 *
 * @param key          B2 object key (from buildObjectKey)
 * @param contentType  MIME type of the file
 * @param expiresIn    Seconds until the URL expires (default: 15 min)
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = UPLOAD_URL_EXPIRY_SECONDS
): Promise<string> {
  const { client, bucket } = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a short-lived pre-signed GET URL for an authorized download.
 *
 * Call this only after verifying that the requesting user is the document
 * uploader, the shop owner, or shop staff. Never expose this URL publicly.
 *
 * @param key       B2 object key
 * @param expiresIn Seconds until the URL expires (default: 5 min)
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn = DOWNLOAD_URL_EXPIRY_SECONDS
): Promise<string> {
  const { client, bucket } = getS3Client();
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Upload a file buffer/stream directly from the server.
 * Prefer pre-signed upload URLs (getSignedUploadUrl) for large files to avoid
 * loading the entire file into Next.js server memory.
 * This method is available for server-internal operations (e.g. thumbnails).
 *
 * @param key         B2 object key
 * @param body        File content (Buffer, Uint8Array, or ReadableStream)
 * @param contentType MIME type
 * @param contentLength Optional byte length (improves reliability for streams)
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
  contentLength?: number
): Promise<void> {
  const { client, bucket } = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body as any,
    ContentType: contentType,
    ...(contentLength !== undefined && { ContentLength: contentLength }),
  });
  await client.send(command);
}

/**
 * Check whether an object exists in B2.
 * Returns true if the object exists and is accessible; false otherwise.
 * Does NOT throw — safe to use in "verify after upload" patterns.
 */
export async function exists(key: string): Promise<boolean> {
  const { client, bucket } = getS3Client();
  try {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve metadata about an object without downloading it.
 * Returns null if the object does not exist.
 */
export async function headFile(
  key: string
): Promise<HeadObjectCommandOutput | null> {
  const { client, bucket } = getS3Client();
  try {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    return await client.send(command);
  } catch {
    return null;
  }
}

/**
 * Delete an object from B2.
 * Safe to call even if the object does not exist — no-ops in that case.
 */
export async function deleteFile(key: string): Promise<void> {
  const { client, bucket } = getS3Client();
  try {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await client.send(command);
  } catch {
    // Treat "not found" as a successful delete
  }
}
