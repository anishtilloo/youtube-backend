import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteVideosOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    // get the dta from the frontend
    // validation - not empty
    // upload on cloudinary and update video against the user
    // save in DB
    // return res
    if (!title) {
      throw new ApiError(400, "Title for the Video is mandatory");
    }

    let localVideoPath;
    if (
      req.files &&
      Array.isArray(req.files.videoFile) &&
      req.files.videoFile.length > 0
    ) {
      localVideoPath = req.files?.videoFile[0]?.path;
    }

    let localThumbnailPath;
    if (
      req.files &&
      Array.isArray(req.files.thumbnail) &&
      req.files.thumbnail.length > 0
    ) {
      localThumbnailPath = req.files?.thumbnail[0]?.path;
    }

    if (!localVideoPath) {
      throw new ApiError(400, "Video file is required");
    }

    const uplodeVideoFileOnCloudinary =
      await uploadOnCloudinary(localVideoPath);

    if (!uplodeVideoFileOnCloudinary) {
      throw new ApiError(400, "Video file is required");
    }

    const uplodeThumbnailOnCloudinary =
      await uploadOnCloudinary(localThumbnailPath);

    if (!uplodeThumbnailOnCloudinary) {
      throw new ApiError(400, "Thumbnail file is required");
    }

    const userId = req.user._id;
    const video = await Video.create({
      videoFile: uplodeVideoFileOnCloudinary.url,
      thumbNail: uplodeThumbnailOnCloudinary.url,
      title,
      description,
      duration: uplodeVideoFileOnCloudinary.duration,
      user: userId,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          video: video,
        },
        "Successfully uploaded the video."
      )
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(500, "Somethin went wrong, while uploading the video.")
      );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const idTypeIsValid = mongoose.Types.ObjectId.isValid(videoId);
  if (!idTypeIsValid) {
    throw new ApiError(404, "The video id is is not valid");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video with this id does not exist");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        video: video,
      },
      "Successfully fetched the video with the given Id"
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  try {
    const idTypeIsValid = mongoose.Types.ObjectId.isValid(videoId);
    if (!idTypeIsValid) {
      throw new ApiError(404, "The video id is is not valid");
    }
  
    const { title, description } = req.body;
  
    let localThumbnailPath;
    if (
      req.files &&
      Array.isArray(req.files.thumbnail) &&
      req.files.thumbnail.length > 0
    ) {
      localThumbnailPath = req.files?.thumbnail[0]?.path;
    }
  
     if (!title || !description || !localThumbnailPath) {
       new ApiError(
         400,
         "Title or Description or Thumbnail is required to update"
       );
     }
  
    const uplodeThumbnailOnCloudinary =
      await uploadOnCloudinary(localThumbnailPath);
  
    if (!uplodeThumbnailOnCloudinary) {
      throw new ApiError(400, "Error during uploading thumbnail on Cloudinary");
    }
  
    const video = await Video.findByIdAndUpdate(videoId, {
      title,
      description,
      thumbNail: uplodeThumbnailOnCloudinary.url,
    });

    return res.status(200).json(new ApiResponse(200, { video: video }, "Successfully updated title or description or thumbnail of the video"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong, during updating the title or description or thumbnail");
  }

});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  try{
    const video = await Video.findById({
      _id: videoId
    })
    const videoUrl = video.videoFile;
    let videoPublicId = videoUrl.split("/");
    videoPublicName = videoPublicId[videoPublicId - 1].split(".");
    
    if (videoUrl) {
      await deleteVideosOnCloudinary(videoPublicName[0]);
    }

    await Video.findByIdAndDelete({
      _id: videoId,
    });
    
    return res.status(200).json(
      new ApiResponse(200, "Video Successfully deleted")
    )
  } catch(error) {
    throw new ApiError(500, "Something went wrong, video not deleted");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
