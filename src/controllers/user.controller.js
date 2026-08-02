import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Somethng went wrong while generating Acces and Refresh token")
    }
}

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
    const { fullName, email, username, password } = req.body;
    //console.log("email", email);

    //VALIDATE THE DETAILS
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
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
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(400, "User with email or username already exists");
    }
    console.log(req.files);

    //CHECK FOR IMAGES, CHECK FOR  AVATAR
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    console.log("avatarlocalPath", avatarLocalPath);

    let coverImageLocalPath;
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    console.log("coverImageLocalPath", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    //UPLOAD IMAGE TO CLOUDINARY
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
        throw new ApiError(500, "Error uploading avatar to cloudinary");
    }

    //CREATE USER OBJECT ENTRY IN DATABASE
    const user = await User.create({
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    //REMOVE PASSWORD AND REFRESH TOKEN FROM RESPONSE
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    //CHECK FOR USER CREATION
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    //RETURN RESPONSE
    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )






})

const loginUser = asyncHandler(async (req, res) => {
    //GET DETAILS FROM USER-req.body
    //USERNAME OR EMAIL, PASSWORD
    //FIND USER IN DATABASE
    //PASSWORD CHECK
    //ACCESS TOKEN AND REFRESH TOKEN GENERATION
    //SEND COOKIE WITH REFRESH TOKEN

    //GET DETAILS FROM USER-req.body
    const { email, username, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    //FIND USER IN DATABASE
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    //PASSWORD CHECK
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    //ACCESS TOKEN AND REFRESH TOKEN GENERATION
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    //SEND COOKIE WITH REFRESH TOKEN
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
                "User logged in successfully"
            )
        )



})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    const decodedToken = jwt.verify(
        incomningRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)
    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    try {
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};