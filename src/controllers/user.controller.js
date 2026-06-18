import {asyncHandler} from '../utils/asynchandler.js';
import {ApiError} from '../utils/apierror.js';
import {User} from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    //GET DETAILS FROM FRONTEND
    //VALIDATE THE DETAILS
    //CHECK IF USER ALREADY EXISTS, IF YES, THROW ERROR
    //CHECK FOR IMAGES, CHECK FOR  AVATAR
    //UPLOAD IMAGE TO CLOUDINARY
    //CREATE USER OBJECT ENTRY IN DATABASE
    //REMOVE PASSWORD AND REFRESH TOKEN FROM RESPONSE
    //CHECK FOR USER CREATION
    //RESTURN RESPONSE

//GET DETAILS FROM FRONTEND
    const {fullName, email, username, password} = req.body;
    console.log("email", email);

//VALIDATE THE DETAILS
    if(
        [fullName, email, username, password].some((field) =>
            field?.trim() === ""
    )
    ) {
        throw new ApiError(400, "All fields are required" );
    }

    //another way to check for empty fields
    // if (
    //     fullName === "" || 
    //     email === "" || 
    //     username === "" || 
    //     password === ""
    // ) {
    //     throw new ApiError(400, "All fields are required");
    // }

    // // First, check if they even exist
    // if (!fullName || !email || !username || !password) {
    //     throw new ApiError(400, "All fields are required");
    // }

    // // Then, make sure they aren't just empty spaces
    // if (fullName.trim() === "" || email.trim() === "" || username.trim() === "" || password.trim() === "") {
    //     throw new ApiError(400, "Fields cannot be empty spaces");
    // }

//CHECK IF USER ALREADY EXISTS, IF YES, THROW ERROR
    const existedUser = User.findOne({
            $or: [{ email },{ username }]
        })
        if (existedUser){
            throw new ApiError(400, "User with email or username already exists");
        }

//CHECK FOR IMAGES, CHECK FOR  AVATAR
        const avatarLocalPath = req.files?.avatar[0]?.path;
        console.log("avatarlocalPath", avatarLocalPath);

        const ImageLocalPath = req.files?.image[0]?.path;
        console.log("imageLocalPath", ImageLocalPath);

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar is required");
        }

        if(!ImageLocalPath){
            throw new ApiError(400, "Image is required");
        }

        //UPLOAD IMAGE TO CLOUDINARY
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(ImageLocalPath);

        if(!avatar){
            throw new ApiError(400, "Avatar file is required");
        }

        //CREATE USER OBJECT ENTRY IN DATABASE
        const user = await User.create({
            fullName,
            avatar :avatar.url,
            coverImage : coverImage?.url || "",
            email,
            password,
            username : username.toLowerCase(),
        })

//REMOVE PASSWORD AND REFRESH TOKEN FROM RESPONSE
        const createdUser = await User.findById(user. id).select("-password -refreshToken");

        //CHECK FOR USER CREATION
        if (!createdUser){
            throw new ApiError(500, "Something went wrong while registering user");
        }

      //RETURN RESPONSE
      res.status(201).json(
        new ApiResponse(200, crestedUser, "User registered successfully")
      )
      



        

})

export {registerUser};