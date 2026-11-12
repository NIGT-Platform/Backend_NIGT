import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { AppError } from '../middleware/error.middleware';

const getCloudinaryCredentials = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

  return { cloudName, apiKey, apiSecret, cloudinaryUrl };
};

export const isCloudinaryConfigured = (): boolean => {
  const { cloudName, apiKey, apiSecret, cloudinaryUrl } = getCloudinaryCredentials();
  return Boolean((cloudName && apiKey && apiSecret) || cloudinaryUrl);
};

export const getCloudinaryStatus = () => {
  const { cloudName, apiKey, apiSecret, cloudinaryUrl } = getCloudinaryCredentials();
  return {
    configured: isCloudinaryConfigured(),
    cloudName: cloudName || (cloudinaryUrl ? '(via CLOUDINARY_URL)' : null),
    hasApiKey: Boolean(apiKey || cloudinaryUrl),
    hasApiSecret: Boolean(apiSecret || cloudinaryUrl),
    environment: process.env.NODE_ENV || 'development',
  };
};

const configureCloudinary = () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  } else if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  }
};

// Configure on import if present
if (isCloudinaryConfigured()) {
  configureCloudinary();
}

/**
 * Uploads an uploaded file (from Multer) to Cloudinary.
 * - Preserves the exact uploaded image without cropping or altering content.
 * - If Cloudinary credentials are set, uploads to Cloudinary, removes the temporary local file,
 *   and returns the secure HTTPS CDN URL.
 * - In local development without Cloudinary configured, returns `/uploads/${file.filename}`
 *   so local testing still works via Express static serving.
 * - In production (or if Cloudinary credentials ARE configured and upload fails), throws a
 *   descriptive AppError rather than silently saving a broken ephemeral local path.
 */
export const uploadFileToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'general'
): Promise<string> => {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

  if (!isCloudinaryConfigured()) {
    if (isProd) {
      throw new AppError(
        'Cloudinary is not configured on the server (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
        500
      );
    }
    console.warn(`⚠️ Cloudinary env vars not set locally — serving local upload: /uploads/${file.filename}`);
    return `/uploads/${file.filename}`;
  }

  configureCloudinary();

  try {
    const isPdf = file.mimetype === 'application/pdf';
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `nigt/${folder}`,
      resource_type: isPdf ? 'raw' : 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    // Remove temporary local file to keep server clean
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (_) {
        // Silently proceed if already deleted
      }
    }

    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Cloudinary upload failed:', error?.message || error);
    // Clean up local temp file on failure in production
    if (isProd && file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
    }
    throw new AppError(
      `Cloudinary image upload failed: ${error?.message || 'Check Cloudinary credentials'}`,
      502
    );
  }
};
