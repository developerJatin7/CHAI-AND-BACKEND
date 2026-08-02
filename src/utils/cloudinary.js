import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Configure cloudinary inside the function so that dotenv has had time to load
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        // console.log("file uploaded to cloudinary successfully", response);
        // remove the locally saved temporary file as the upload operation got successful
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        fs.unlinkSync(localFilePath);
        console.log("error uploading file to cloudinary", error);
        return null;
    }
}
    
export { uploadOnCloudinary };