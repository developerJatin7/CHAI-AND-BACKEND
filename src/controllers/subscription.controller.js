import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const subscribeToChannel = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;
    if (!channelId || !subscriberId) {
        throw new ApiError(400, "Channel id and subscriber id are required");
    }

    if (!mongoose.Types.ObjectId.isValid(channelId) || !mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid channel id or subscriber id");
    }
    if (channelId.toString() === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }


    const existingSubscription = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });
    if (existingSubscription) {
        throw new ApiError(409, "You are already subscribed to this channel")
    }

    const subscription = await Subscription.create(
        {
            subscriber: subscriberId,
            channel: channelId
        }
    );
    return res
        .status(201)
        .json(new ApiResponse(
            201,
            { subscription },
            "Subscribed to channel successfully"
        ))
})

const unsubscribeFromChannel = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;
    if (!channelId || !subscriberId) {
        throw new ApiError(400, "Channel id and subscriber id are required");
    }
    if (!mongoose.Types.ObjectId.isValid(channelId) || !mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid channel id or subscriber id");
    }
    if (channelId.toString() === subscriberId.toString()) {
        throw new ApiError(400, "You cannot unsubscribe from your own channel");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });
    if (!existingSubscription) {
        throw new ApiError(404, "You are not subscribed to this channel");
    }

    await Subscription.findByIdAndDelete(existingSubscription._id);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Unsubscribed from channel successfully"
        ))

})

const getSubscribersCount = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(400, "Channel id is required");
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const channel = await User.findById(channelid);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribersCount = await Subscription.countDocuments({ channel: channelId });
    if (subscribersCount === 0) {
        return res
            .status(200)
            .json(new ApiResponse
                (200,
                    { count: 0 },
                    "No subscribers found"
                )
            );
    }

})



export {
    subscribeToChannel,
    unsubscribeFromChannel,
    getSubscribersCount
};


