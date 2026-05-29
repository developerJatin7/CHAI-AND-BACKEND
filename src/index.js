import dotenv from 'dotenv';

// import mongoose from 'mongoose';
// import {DB_NAME} from '../constants';
import connectDB from './db/index.js';
dotenv.config({path:'.env'});
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed !!!",err);
})

        







// const connectDB = async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DBname}`)
//     }
//     catch (err) {
//         console.error(err);
//         throw err;
//     }   
// }