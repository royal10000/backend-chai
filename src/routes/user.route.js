import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js ";
import { upload } from "../middlewares/multer.middleware.js"
import { changePassword, getAllUser, getCurrentUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, updateCoverImage, updateProfile, updateUserAvatar } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route('/register').post(
    upload.fields(
        [
            { name: "avatar", maxCount: 1 },
            { name: "coverImage", maxCount: 1 }
        ]
    ),
    registerUser
)

userRouter.route("/login").post(loginUser)


// secured routes
userRouter.route('/logout').post(verifyJWT, logoutUser)
userRouter.route('/refresh-token').post( refreshAccessToken)
userRouter.route('/changePassword').post(verifyJWT, changePassword)
userRouter.route("/currentUser").get(verifyJWT, getCurrentUser)
userRouter.route("/updateProfile").patch(verifyJWT, updateProfile)
userRouter.route("/updateCoverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)
userRouter.route("/updateAvatarImage").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
userRouter.route('/c/:username').get(getUserChannelProfile)
userRouter.route('/').get(getAllUser)
// Router.
export default userRouter;  