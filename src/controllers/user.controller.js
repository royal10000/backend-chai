// import { asyncHandler } from "../utils/asyncHandler.js "
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    /**
     * Get user details from frontend
     * validation - not empty 
     * check if user already exists : username, email
     * check for images, check for avatar
     * upload them to cloudinary, avatar
     * create user object -> create entry in db
     * remoove password and refresh token field from response
     * check for user creation 
     * return response  
     */
    const { fullname, username, email, password } = req.body
    const { avatar, coverImage } = req.files


    // if(fullname===""){
    //     throw new ApiError(400,"fullname is required")
    // }

    if (
        [fullname, username, password, email].some((field) => {
            return field?.trim() === ""
        })
    ) {
        throw new ApiError(404, "All field are required")
    }

    existedUser = User.findOne({
        $or: ({ email }, { username })
    })

    if (existedUser) {
        // throw new ApiError(409, "username or email is already existed ")
        throw new ApiError(409,"feeded data is already is in database")
    }


    if (!avatar) {
        throw new Error(400, " Avatar file is required");
    }

    const avatarPath = await uploadOnCloudinary(avatar.path)
    const coverImagePath = await uploadOnCloudinary(coverImage.path)


    if (!avatarPath) {
        throw new Error(400, " Avatar file is required");
    }

    const user = User.create({
        fullname: fullname,
        avatar: avatarPath.url,
        coverImage: coverImagePath?.url || "",
        email: email,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})

export { registerUser };