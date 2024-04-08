import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from 'mongoose'

const uploadVideo = asyncHandler(async (req, res) => {
    const videoLocalPath = req.files?.video[0].path
    const ThumbnailLocalPath = req.files?.videoThumbnail[0].path


    const { title, description, ispublished } = req.body
    const isPublishedBool = ispublished === "true";



    if (!(title && description)) {
        throw new ApiError(400, "all field are required")
    }

    const { url, duration } = await uploadOnCloudinary(videoLocalPath)

    const thumbnailCloudinary = await uploadOnCloudinary(ThumbnailLocalPath)


    const { _id } = req.user

    const uploadedVideo = await Video.create({
        videoFile: url,
        thumbnail: thumbnailCloudinary.url,
        title: title,
        description,
        duration: duration,
        owner: _id,
        isPublished: isPublishedBool

    })

    res.status(200).json(
        new ApiResponse(200, uploadedVideo, "video uploaded successfully  ")
    )
})

const getVideos = asyncHandler(async (req, res) => {
    try {
        const getVideos = await Video.aggregate(
            [
                {
                    $match: {
                        isPublished: true
                    }
                },
                {
                    $limit: 10
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    fullname: 1
                                }
                            }
                        ]
                    }
                }
            ]
        )


        res.status(200).json(
            new ApiResponse(200, getVideos, "video fetched successfuly")
        )

    } catch (error) {
        throw new ApiError(500, "Unable to fetch videos from database")
    }
})

const getSearchedVideo = asyncHandler(async (req, res) => {
    try {
        const { search_query, qs } = req.query

        const viewsCount = {}
        viewsCount[qs] = 1
        const searchedVideo = await Video.aggregate([
            {
                $match: {
                    title: search_query,
                    isPublished: true
                },
            },
            {
                $sort: viewsCount
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "owner",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1
                            }
                        }
                    ]
                }
            }

        ])

        res.status(200).json(
            new ApiResponse(200, searchedVideo, "Searched video fetched successfully")
        )
    } catch (error) {
        throw new ApiError(402, "Searched video is not available ", error)
    }
})

const getSingleVideo = asyncHandler(async (req, res) => {
    try {
        const { singleVideo } = req.params;
        const aggregateVideo = await Video.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(singleVideo)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscriber"
                            }
                        }, {
                            $lookup: {
                                from: "users",
                                localField: "_id",
                                foreignField: "channel",
                                as: "channel"  // to get the channel count (not required || optional as we have to show only subscriber count)
                            }
                        },
                        {
                            $addFields: {
                                subscriberCount: {
                                    $sum: "$channel" //to count subscriber 
                                },
                                issubscribed: {
                                    $cond: {
                                        if: { $in: [req.user?._id, "$subscriber.subscriber"] },
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
                                subscriberCount: 1,
                                issubscribed: 1
                            }
                        }
                    ]
                },
            },
            // {
            //     $lookup: {
            //         from: "likes",
            //         localField:"likes",
            //         foreignField:"_id",
            //         as:"likesby"
            //     }
            // }
        ])

        if (aggregateVideo.length < 1) {
            res.status(400).json(
                new ApiError(400, "Video not found")
            )
        }
        res.status(200).json(
            new ApiResponse(200, aggregateVideo, "Single Video fetched succesfully")
        );

    } catch (error) {
        throw new ApiError(400, "Something is wrong in Single Video || not available given video", error);
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        let videoLocalPath;
        let videoThumbnailLocalpath
        if (req.files) {
            if (req.files.video && req.files?.video[0]) {
                videoLocalPath = req.files?.video[0]?.path
                const cloudinaryVideopath = await uploadOnCloudinary(videoLocalPath)
                await Video.findByIdAndUpdate(videoId, {
                    $set:
                    {
                        videoFile: cloudinaryVideopath.url,
                    }

                })

            }

            if (req.files.videoThumbnail && req.files?.videoThumbnail[0]) {
                videoThumbnailLocalpath = req.files?.videoThumbnail[0].path
                const cloudinaryVideoThumbnailpath = await uploadOnCloudinary(videoThumbnailLocalpath)
                await Video.findByIdAndUpdate(videoId, {
                    $set:
                    {
                        thumbnail: cloudinaryVideoThumbnailpath.url
                    }
                })
            }

        }

        if (req.body && Object.keys(req.body).length > 0) {
            const { title, description, publishStatus } = req.body

            const isPublished = publishStatus === "true"

            if (title || description || isPublished) {
                await Video.findByIdAndUpdate(videoId, {
                    $set: {
                        title,
                        description,
                        isPublished
                    }
                })
            }
            else {
                throw new ApiError(400, "somethinng is wrong in req body")
            }
        }

        const updatedVideo = await Video.findById(videoId)
        if (!updatedVideo) {
            throw new ApiError(200, "Video not found")
        }

        res.status(200).json(
            new ApiResponse(200, updatedVideo, "video update success fully")
        )


    } catch (error) {
        throw new ApiError(400, "Something is wrong while updating video  ", error)
    }
})


const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        const deletedVideo = await Video.findByIdAndDelete(videoId)
        if (deletedVideo < 1) {
            res.status(400).
                json(
                    new ApiError(400, "no video found to delete")
                )
        }
        res.status(200).
            json(
                new ApiResponse(200, {}, "Video deleted successfully")
            )
    } catch (error) {
        throw new ApiError(400, "something went wrong while deleting video", error)
    }
})


export {
    uploadVideo,
    getVideos,
    getSearchedVideo,
    getSingleVideo,
    updateVideo,
    deleteVideo,
}