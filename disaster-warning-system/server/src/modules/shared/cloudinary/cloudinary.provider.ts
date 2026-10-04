import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
      api_key: process.env.CLOUDINARY_API_KEY || '1234567890',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'secret',
    });
  },
};
