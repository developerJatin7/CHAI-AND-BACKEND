import {Router} from 'express';
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router.route("/:videoId/comments").get(getVideoComments)
router.route("/:videoId/comments").post(verifyJWT, addComment)
router.route("/:videoId/comments/:commentId").patch(verifyJWT, updateComment)
router.route("/:videoId/comments/:commentId").delete(verifyJWT, deleteComment)

export default router;