import {Router} from 'express';
import {
    subscribeToChannel,
    unsubscribeFromChannel,
    getSubscribersCount,
    getSubscribedChannels
} from '../controllers/subscription.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/c/:channelId')
    .post(verifyJWT, subscribeToChannel)
    .delete(verifyJWT, unsubscribeFromChannel);

router.route('/c/:channelId/subscribers-count')
    .get(getSubscribersCount);

router.route('/subscribed-channels')
    .get(verifyJWT, getSubscribedChannels);

export default router;
