import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//  Toggle Like on Video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const userId = req.user?._id;

    // Check if like already exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    if (existingLike) {
        // Unlike: Remove the like
        await Like.findByIdAndDelete(existingLike._id);

        return res
            .status(200)
            .json(new ApiResponse(
                200, 
                { isLiked: false },
                 "Video unliked successfully")
                );
    }

    // Like: Create a new like
    const newLike = await Like.create({
        video: videoId,
        likedBy: userId,
    });

    if (!newLike) {
        throw new ApiError(500, "Failed to like the video");
    }

    return res
        .status(201)
        .json(new ApiResponse(
            201, 
            { isLiked: true },
             "Video liked successfully")
            );
});

//  Toggle Like on Comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const userId = req.user?._id;

    // Check if like already exists
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId,
    });

    if (existingLike) {
        // Unlike: Remove the like
        await Like.findByIdAndDelete(existingLike._id);

        return res
            .status(200)
            .json(new ApiResponse(
                200, 
                { isLiked: false },
                 "Comment unliked successfully")
                );
    }

    // Like: Create a new like
    const newLike = await Like.create({
        comment: commentId,
        likedBy: userId,
    });

    if (!newLike) {
        throw new ApiError(500, "Failed to like the comment");
    }

    return res
        .status(201)
        .json(new ApiResponse(
            201, 
            { isLiked: true },
             "Comment liked successfully")
            );
});

//  Toggle Like on Tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const userId = req.user?._id;

    // Check if like already exists
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId,
    });

    if (existingLike) {
        // Unlike: Remove the like
        await Like.findByIdAndDelete(existingLike._id);

        return res
            .status(200)
            .json(new ApiResponse(
                200, 
                { isLiked: false },
                 "Tweet unliked successfully")
                );
    }

    // Like: Create a new like
    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: userId,
    });

    if (!newLike) {
        throw new ApiError(500, "Failed to like the tweet");
    }

    return res
        .status(201)
        .json(new ApiResponse(
            201,
             { isLiked: true },
              "Tweet liked successfully")
            );
});

//  Get All Liked Videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    // Aggregate 
    const likedVideos = await Like.aggregate([
        // Match likes 
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true, $ne: null },
            },
        },
        // Lookup video details
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    // Lookup owner details of the video
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$ownerDetails" },
                        },
                    },
                    {
                        $project: {
                            ownerDetails: 0,
                        },
                    },
                ],
            },
        },
        // Unwind 
        {
            $unwind: "$videoDetails",
        },
        // return published videos
        {
            $match: {
                "videoDetails.isPublished": true,
            },
        },
        // Sort by liked date 
        {
            $sort: { createdAt: -1 },
        },
        //  project the final output
        {
            $project: {
                _id: 0,
                videoDetails: 1,
                likedAt: "$createdAt",
            },
        },
    ]);

    if (!likedVideos || likedVideos.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No liked videos found"));
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            likedVideos,
             "Liked videos fetched successfully")
            );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
};