import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteImageOnCloudinary,
} from "../utils/cloudinary.js";
import {
  generateAccessAndRefreshToken,
  verifyToken,
} from "../modules/token.js";

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

  const { fullName, userName, email, password } = req.body;

  // here we are checking even after trimming the fields if they are empty throw an error
  // here some function works loops through the array checking the condition and returning a Boolean true or false
  // even if one of the condition is true it will return and throw an error
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(403, "Bad Request: All field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with this email or username already exist");
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  //   const coverImageLocalFilePath = req.files?.coverImage[0]?.path

  let coverImageLocalFilePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const uploadAvatarOnCloudinary =
    await uploadOnCloudinary(avatarLocalFilePath);
  const uploadCoverImageOnCloudinary = await uploadOnCloudinary(
    coverImageLocalFilePath
  );

  if (!uploadAvatarOnCloudinary) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: uploadAvatarOnCloudinary.url,
    coverImage: uploadCoverImageOnCloudinary?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // here we are removing the the password and refreshToken from the response
  // to send that response to the user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

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

  const { userName, email, password } = req.body;

  if (!userName && !email) {
    throw new ApiError(404, "Either username or email is required");
  }

  // {
  // $or: [{username}, {email}]
  // }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "User does not exist");
  }

  const passwordIsValid = user.isPasswordCorrect(password);

  if (!passwordIsValid) {
    throw new ApiError(404, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

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
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      // $set: {
      //   refreshToken: undefined, // undefined in update query ignores the field and does nothing to it
      //   // and when we set it to null it actually set the value of that field to null
      // },
      $unset: {
        refreshToken: 1, // removes the field from the document
      },
    },
    {
      new: true,
    }
  );

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
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request");
    }

    const decodedToken = await verifyToken(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired, or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new ApiError(401, "New and Confirm Password do not match");
  }

  // we are getting req.user from the middleware we attached as authentication where we are doing
  // req.user = user where user is fetched using the id which we get from the decoded token
  const user = await User.findById(req.user._id);

  const isPasswordValid = user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

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
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

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
