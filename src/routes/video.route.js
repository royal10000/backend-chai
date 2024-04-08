import { Router } from "express";
import { deleteVideo, getSearchedVideo, getSingleVideo, getVideos, updateVideo, uploadVideo } from "../controllers/video.controller.js";
// import  {ver}  from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const videoRouter = Router()


videoRouter.route("/").get(getVideos)
videoRouter.route("/searchVideo").get(getSearchedVideo)
videoRouter.route("/:singleVideo").get(getSingleVideo)

// secure route
videoRouter.route("/uploadvideo").post(verifyJWT, upload.fields([
    { name: "video", maxCount: 1 },
    { name: "videoThumbnail", maxCount: 1 }
]), uploadVideo)
videoRouter.route("/:videoId").patch(verifyJWT, upload.fields([
    {
        name: "video", maxCount: 1
    },
    {
        name: "videoThumbnail", maxCount: 1
    }
]), updateVideo)
// videoRouter.route("/:videoId").patch(verifyJWT, upload.single('videoThumbnail'),updateVideoThumbnail)
videoRouter.route("/:videoId").delete(verifyJWT, deleteVideo)
export default videoRouter;