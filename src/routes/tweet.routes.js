import Router from "express";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router =Router();

router.route("/").post(verifyJWT, createTweet)                         // POST   /api/v1/tweets
router.route("/user/:userId").get(getUserTweets)            // GET    /api/v1/tweets/user/:userId
router.route("/:tweetId").patch(verifyJWT, updateTweet)                // PATCH  /api/v1/tweets/:tweetId
router.route("/:tweetId").delete(verifyJWT, deleteTweet)               // DELETE /api/v1/tweets/:tweetId

export default router