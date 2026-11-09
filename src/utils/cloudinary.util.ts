import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Lazy configure or configure on import
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads an uploaded file (from Multer) to Cloudinary.
 * If Cloudinary credentials are set in environment, uploads to Cloudinary,
 * removes the temporary local file from disk, and returns the secure HTTPS CDN URL.
 * If not configured, gracefully falls back to `/uploads/${file.filename}`.
 */
export const uploadFileToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'general'
): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    return `/uploads/${file.filename}`;
  }

  // Ensure config is fresh in case env was loaded late
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const isPdf = file.mimetype === 'application/pdf';
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `nigt/${folder}`,
      resource_type: isPdf ? 'raw' : 'auto',
      use_filename: true,
      unique_filename: true,
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
  } catch (error) {
    console.error('Cloudinary upload failed, falling back to local storage:', error);
    return `/uploads/${file.filename}`;
  }
};
