import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "unauthorized request")
        }

        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const userFind = await User.findById(decodedToken?._id).select("-password refreshToken")

        if (!userFind) {
            // Todo : Discuss about frontend
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = userFind
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})