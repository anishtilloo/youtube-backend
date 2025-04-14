import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../db/models/user.model.js";
import {
  uploadOnCloudinary,
  deleteImageOnCloudinary,
} from "../utils/cloudinary.js";
import {
  generateAccessAndRefreshToken,
  verifyToken,
} from "../services/TokenService.js";

import UserRepository from "../repositories/UserRepository.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const avatarLocalFilePath = req.files?.avatar[0]?.path;

  let coverImageLocalFilePath = null;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files?.coverImage[0]?.path;
  }

  const userData = req.body;
  const fileData = {
    avatarLocalFilePath,
    coverImageLocalFilePath,
  }
  const createdUser = await UserRepository.registerUser(userData, fileData);

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take email and password as input
  // check if the email exist in the DB if it does the go ahead with further steps and if not throw error
  // compare the password using bcrypt if matching go further with login if not throw error
  // generate the access and refresh tokens
  // generate response log in the user

  const userData = req.body;

  const loggedInUser = await UserRepository.loginUser(userData);

  // with these options only the server can mutate the cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // since we have user the middleware cookieParser we can send and access cookies by chaining them in res and req objects
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser.user,
          accessToken: loggedInUser.accessToken,
          refreshToken: loggedInUser.refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  await UserRepository.logoutUser(userId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const tokens = await UserRepository.refreshToken(incomingRefreshToken);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", tokens.accessToken, options)
      .cookie("refreshToken", tokens.refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { 
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const passwords = req.body;
  
  await UserRepository.changeUserPassword(passwords, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    res
      .status(200)
      .json(
        new ApiResponse(200, { user: req.user }, "User fetched successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong, while fetching current user"
    );
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const accountData = req.body;
  const user = await UserRepository.updateAccountDetails(accountData, req.user._id)

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // it will be file when uploading single file, but files when uploading multiple files
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "No file uploaded, Avatar file is missing");
  }

  //TODO: delete old image - assignment
  // getting the public id from the url
  const prevAvatarUrl = req.user.avatar;
  let avatarPublicName = prevAvatarUrl.split("/");
  avatarPublicName = avatarPublicName[avatarPublicName.length - 1].split(".");

  if (prevAvatarUrl) {
    await deleteImageOnCloudinary(avatarPublicName[0]);
  } 

  const uploadAvatarOnCloudinary = await uploadOnCloudinary(avatarLocalPath);

  if (!uploadAvatarOnCloudinary.url) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: uploadAvatarOnCloudinary.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar file is uploaded successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // it will be file when uploading single file, but files when uploading multiple files
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "No file uploaded, Cover Image file is missing");
  }

  //TODO: delete old image - assignment
  // getting the public id from the url
  const prevCoverImageUrl = req.user.coverImage;
  let coverImagePublicName = prevCoverImageUrl.split("/");
  coverImagePublicName =
    coverImagePublicName[coverImagePublicName.length - 1].split(".");

  if (prevCoverImageUrl) {
    await deleteImageOnCloudinary(coverImagePublicName[0]);
  }

  const uploadCoverImageOnCloudinary =
    await uploadOnCloudinary(coverImageLocalPath);

  if (!uploadCoverImageOnCloudinary.url) {
    throw new ApiError(400, "Cover Image file is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: uploadCoverImageOnCloudinary.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover Image file is uploaded successfully")
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  // mongodb aggregation pipelines
  const channel = await User.aggregate([
    {
      $match: { userName: userName?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "channel_subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "channel_subscribed_to",
      },
    },
    {
      $addFields: {
        channelSubscribersCount: {
          $size: "$channel_subscribers",
        },
        channelSubscribedToCount: {
          $size: "$channel_subscribed_to",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$channel_subscribed_to.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        channelSubscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }
         
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        channel: channel[0],
      },
      "Successfully returned channel with subscribers and subscribed to count"
    )
  );
});

const getUserHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // write sub pipeline using pipeline
          {
            $lookup: {
              //inside the videos table there is owner which is linked to the users to to add values to it we are using lookup here
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                // to add more pipelines inside inside it we are using pipeline
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                    coverImage: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.watchHistory[0],
        "user watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserHistory,
};
