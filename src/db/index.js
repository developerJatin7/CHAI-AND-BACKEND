import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

const connectDB = async ()=> {
    try  {
        const baseUri = process.env.MONGODB_URI;

        if (!baseUri) {
            throw new Error('MONGODB_URI is missing in .env');
        }

        const connectionInstance=await mongoose.connect(`${baseUri}/${DB_NAME}`)
        console.log(`\n MONGODB connected !! DB hosted: ${connectionInstance.connection.host}`)
    }
    catch (error) {
        if (error?.name === 'MongoServerError' && error?.code === 8000) {
            console.log('MONGODB auth failed: verify MongoDB Atlas username/password in MONGODB_URI.');
            console.log('If password has special characters, URL-encode it (for example @ as %40).');
            console.log('Also confirm the Atlas DB user exists and has access to this cluster.');
        }
        console.log("MONGODB connection failed", error)
        process.exit(1);
    }
}

export default connectDB;