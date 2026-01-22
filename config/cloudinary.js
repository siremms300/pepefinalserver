// config/cloudinary.js - Add debugging
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
 
dotenv.config();
 
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUD_NAME ? 'Set' : 'Missing',
  api_key: process.env.CLOUD_API_KEY ? 'Set' : 'Missing',
  api_secret: process.env.CLOUD_API_SECRET ? 'Set' : 'Missing'
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET, 
  secure: true
});

// Test the configuration
cloudinary.api.ping()
  .then(result => console.log('Cloudinary connection successful:', result))
  .catch(error => console.error('Cloudinary connection failed:', error));

export default cloudinary;







// import { v2 as cloudinary } from 'cloudinary';
// import dotenv from 'dotenv';

// dotenv.config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true
// });

// export default cloudinary; 