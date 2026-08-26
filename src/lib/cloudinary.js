import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_API, CLOUDINARY_API_SECRET, CLOUDINARY_NAME } from './secret';

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true, 
});

export async function uploadToCloudinary(file, folder = 'ecom') {
  if (!file) return null;
  
  // File can be a File object or Blob. Get its Buffer.
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            id: result.public_id,
          });
        }
      }
    ).end(buffer);
  });
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return null;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

export default cloudinary;
