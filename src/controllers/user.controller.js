import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const userFind = await User.findById(userId)
        const accessToken = userFind.generateAccessToken()
        const refreshToken = userFind.generateRefreshToken()

        userFind.set({ refreshToken: refreshToken })
        await userFind.save({ validateBeforeSave: false });
        return { accessToken, refreshToken }
    } catch (e) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token ")
    }
}

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
    const avatarPath = req.files?.avatar[0]?.path

    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path
    }

    if (
        [fullname, username, password, email].some((field) => {
            return field?.trim() === ""
        })
    ) {
        throw new ApiError(404, "All field are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    });


    if (existedUser) {
        // throw new ApiError(409, "username or email is already existed ")
        throw new ApiError(409, "feeded data is already is in database")
    }



    if (!avatarPath) {
        throw new ApiError(400, " Avatar file is required in controller");
    }


    const cloudinaryavatarPath = await uploadOnCloudinary(avatarPath)

    const cloudinarycoverImagePath = await uploadOnCloudinary(coverImagePath)


    if (!cloudinaryavatarPath) {
        throw new ApiError(400, " Avatar file is required");
    }



    const newUser = await User.create({
        fullname: fullname,
        avatar: cloudinaryavatarPath.url,
        coverImage: cloudinarycoverImagePath?.url || "",
        email: email,
        username: username.toLowerCase(),
        password: password
    })

    // const createdUser = await User.findById(newUser._id).select("-refreshToken -password")
    const createdUser = await User.findById(newUser._id).select("-refreshToken -password");

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    /**
     * //from user
     * username || email
     * password
     * check both are valid 
     * find the user
     * check username and password (encrypt password)
     * access and refresh token 
     * send cookies
     * response with successfully login
     */
    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, 'username or email is required')
    }


    const userFind = await User.findOne({ $or: [{ username }, { email }] })
    if (!userFind) {
        throw new ApiError(404, "user does not exist")
    }



    const ispasswordValid = await userFind.isPasswordCorrect(password)
    if (!ispasswordValid) {
        throw new ApiError(401, "password incorrect")
    }

    // res.status(200).json(
    //     new ApiResponse(200,userFind,"logged in successul")
    // )

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userFind._id)

    const loggedInUser = await User.findById(userFind._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        // .cookie("accessToken", accessToken, options)
        // .cookie("refreshToken", refreshToken, options)

        .json(
            new ApiResponse(202,
                {
                    userFind: loggedInUser, accessToken, refreshToken
                }, "user logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
    )

    // for cookies
    const options = {
        httpOnly: true,
        secure: true
    }


    return res.
        status(200).
        clearCookie("accessToken", options).
        clearCookie("refreshToken", options).
        json(new ApiResponse(200, {}, "USER logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const { _id } = Jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const userFind = await User.findById(_id)
        if (!userFind) {
            throw new ApiError(401, "invalid refresh token")
        }


        if (incomingRefreshToken !== userFind?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userFind._id);
        const user = await User.findById(_id)

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: refreshToken }, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body
    if (!(newPassword === confirmPassword)) {
        throw new ApiError(400, "one of the given new password doesnot match to another")
    }

    const userFind = await User.findById(req.user?._id)
    const isPasswordCorrect = await userFind.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }

    userFind.password = newPassword
    await userFind.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password Changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // const userFind=await findById(req.user?._id).select()
    return res.status(200).json(
        new ApiResponse(200, req.user, "Curren user fetched successfully")
    )
})

const updateProfile = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body
    if (!(fullname || email)) {
        throw new ApiError(400, " All field are required")
    }


    const userFind = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            fullname: fullname,
            email: email
        }
    }, { new: true }).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, userFind, "profile update successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missiong")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const userFind = await User.findByIdAndUpdate(req.user?._id, {
        $set: { avatar: avatar.url }
    },
        { new: true })
        .select("-password")
    return res.status(200).json(new ApiResponse(200, userFind, "avatar image updated successfully"))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missiong")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    const userFind = await User.findByIdAndUpdate(req.user?._id, {
        $set: { coverImage: coverImage.url }
    },
        { new: true }).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(200, userFind, "coverImage updated successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedto"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                coverImage: 1,
                email: 1
            }
        }

    ])

    if (!channel.length) {
        throw new ApiError(404, "channel doesnot exists")
    }
    return res.status(200)
        .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateProfile,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile
};