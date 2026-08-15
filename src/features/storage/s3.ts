/**
 * features/storage/s3.ts
 *
 * Legacy shim — re-exports the canonical B2 storage abstraction so that any
 * existing imports of this module continue to work after the migration from
 * Supabase Storage to Backblaze B2.
 *
 * All new code should import directly from "@/lib/storage/b2".
 */

export {
  buildObjectKey,
  getSignedUploadUrl,
  getSignedDownloadUrl,
  uploadFile,
  exists,
  headFile,
  deleteFile,
  UPLOAD_URL_EXPIRY_SECONDS,
  DOWNLOAD_URL_EXPIRY_SECONDS,
} from "@/lib/storage/b2";
