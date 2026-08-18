import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageNumber = Math.max(1, Number(page) || 1)
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10))
    const skip = (pageNumber - 1) * limitNumber

    if (!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const filter = { video: videoId }

    const [comments, totalComments] = await Promise.all([
        Comment.find(filter)
            .populate("owner", "username fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber),
        Comment.countDocuments(filter)
    ])

    const totalPages = Math.ceil(totalComments / limitNumber)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                page: pageNumber,
                limit: limitNumber,
                totalComments,
                totalPages
            },
            "Video comments fetched successfully"
        )
    )

    


})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    const ownerId = req.user?._id

    if (!videoId || !content || !ownerId) {
        throw new ApiError(400, "Video id, content and owner are required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: ownerId
    })

    const createdComment = await Comment.findById(comment._id)
        .populate("owner", "username fullName avatar")

    return res.status(201).json(
        new ApiResponse(
            201,
            { comment: createdComment },
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    const ownerId = req.user?._id

    if (!commentId || !content || !ownerId) {
        throw new ApiError(400, "Comment id, content and owner are required")
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment")
    }

    comment.content = content.trim()
    await comment.save()

    const updatedComment = await Comment.findById(comment._id)
        .populate("owner", "username fullName avatar")

    return res.status(200).json(
        new ApiResponse(
            200,
            { comment: updatedComment },
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const ownerId = req.user?._id

    if (!commentId || !ownerId) {
        throw new ApiError(400, "Comment id and owner are required")
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}