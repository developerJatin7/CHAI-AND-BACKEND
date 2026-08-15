// ...existing code...
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// 1) Get all videos with query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (userId && isValidObjectId(userId)) {
        filter.owner = userId;
    }

    if (query.trim()) {
        filter.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } }
        ];
    }

    const sort = {};
    sort[sortBy] = sortType === "asc" ? 1 : -1;

    const [videos, totalVideos] = await Promise.all([
        Video.find(filter)
            .populate("owner", "username fullName avatar")
            .sort(sort)
            .skip(skip)
            .limit(limitNumber),
        Video.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalVideos / limitNumber);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    page: pageNumber,
                    limit: limitNumber,
                    totalVideos,
                    totalPages
                },
                "Videos fetched successfully"
            )
        );
});

// 2) Upload a video to Cloudinary and create video record
const createandUploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title?.trim()) {
        throw new ApiError(400, "Title is required");
    }

    if (!description?.trim()) {
        throw new ApiError(400, "Description is required");
    }

    // multer gives file in req.files.videoFile[0].path
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoFileLocalPath);
    if (!uploadedVideo?.url) {
        throw new ApiError(500, "Video upload failed");
    }

    let uploadedThumbnail = null;
    if (thumbnailLocalPath) {
        uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    }

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail?.url || "",
        duration: uploadedVideo.duration || 0,
        owner: req.user?._id,
        views: 0,
        isPublished: true
    });

    const createdVideo = await Video.findById(video._id).populate(
        "owner",
        "username fullName avatar"
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { video: createdVideo },
                "Video uploaded successfully"
            )
        );
});

// 3) Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId).populate(
        "owner",
        "username fullName avatar"
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video fetched successfully")
        );
});

// 4) Update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // check owner
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video");
    }

    if (title !== undefined) {
        if (!title.trim()) {
            throw new ApiError(400, "Title cannot be empty");
        }
        video.title = title.trim();
    }

    if (description !== undefined) {
        if (!description.trim()) {
            throw new ApiError(400, "Description cannot be empty");
        }
        video.description = description.trim();
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if (thumbnailLocalPath) {
        const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!uploadedThumbnail?.url) {
            throw new ApiError(500, "Thumbnail upload failed");
        }
        video.thumbnail = uploadedThumbnail.url;
    }

    await video.save();

    const updatedVideo = await Video.findById(video._id).populate(
        "owner",
        "username fullName avatar"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, { video: updatedVideo }, "Video updated successfully")
        );
});

// 5) Delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// 6) Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to change this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { video },
                `Video ${video.isPublished ? "published" : "unpublished"} successfully`
            )
        );
});

export {
    getAllVideos,
    createandUploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
// ...existing code...