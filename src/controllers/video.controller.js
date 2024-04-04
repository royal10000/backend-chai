import { asyncHandler } from "../utils/asyncHandler.js";

const uploadVideo = asyncHandler(async (req, res) => {
    // console.log(req.files)   
    console.log(req.files?.video[0].path)
    console.log(req.files?.videoThumbnail[0].path)
})

export {
    uploadVideo
}