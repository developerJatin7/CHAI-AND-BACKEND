import dotenv from 'dotenv';

// import mongoose from 'mongoose';
// import {DB_NAME} from '../constants';
import connectDB from './db/index.js';
dotenv.config({path:'.env'});
connectDB()







// const connectDB = async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DBname}`)
//     }
//     catch (err) {
//         console.error(err);
//         throw err;
//     }   
// }