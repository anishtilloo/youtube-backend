import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uplodeOnCloudinary } from "../utils/cloudinary.js";
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
  // here some function works loops through the array checking the condition and returning a boolean truw or false
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

  const uplodeAvatarOnCloudinary =
    await uplodeOnCloudinary(avatarLocalFilePath);
  const uplodeCoverImageOnClodinary = await uplodeOnCloudinary(
    coverImageLocalFilePath
  );

  if (!uplodeAvatarOnCloudinary) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: uplodeAvatarOnCloudinary.url,
    coverImage: uplodeCoverImageOnClodinary?.url || "",
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
      $set: {
        refreshToken: undefined,
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
      throw new ApiError(401, "Unautorized Request");
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

    const { accessToken, newRefreshToken } =
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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
