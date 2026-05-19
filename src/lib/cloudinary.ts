const env = (import.meta as any).env;

export const cloudinaryConfig = {
  cloudName: env.VITE_CLOUDINARY_CLOUD_NAME || 'drmysvfu2',
  uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
};

export const isCloudinaryConfigured = true;

export async function uploadToCloudinary(file: File, folder = 'goldex') {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Cloudinary upload failed.');
  }

  return response.json() as Promise<{ secure_url: string; public_id: string }>;
}
