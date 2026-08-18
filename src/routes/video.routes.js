import {Router} from 'express';
import {
    getAllVideos,
    createandUploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from '../controllers/video.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.route("/").get(getAllVideos).post(verifyJWT, upload.single("video"), createandUploadVideo);
router.route("/:videoId").get(getVideoById)
router.route("/:videoId").patch(verifyJWT, updateVideo)
router.route("/:videoId").delete(verifyJWT, deleteVideo)
router.route("/:videoId/toggle-publish").patch(verifyJWT, togglePublishStatus)
export default router;