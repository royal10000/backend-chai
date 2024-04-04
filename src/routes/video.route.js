import { Router } from "express";
import { uploadVideo } from "../controllers/video.controller.js";
// import  {ver}  from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const videoRouter = Router()

videoRouter.route("/uploadvideo").post(verifyJWT, upload.fields([
    { name: "video", maxCount: 1 },
    { name: "videoThumbnail", maxCount: 1 }
]), uploadVideo)

export default videoRouter;