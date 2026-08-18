import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors({
       origin: process.env.CORS_ORIGIN
}));
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static('public'));
app.use(cookieParser());

// Routes
import userRouter from './routes/user.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import videoRouter from './routes/video.routes.js';
import commentRouter from './routes/comment.routes.js';
import playlistRouter from './routes/playlist.routes.js';


//Routes declaration
app.use("/api/v1/users",userRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
app.use("/api/v1/videos",videoRouter);
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/playlists",playlistRouter);
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/likes", likeRouter);

export default app;