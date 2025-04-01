import jwt from "jsonwebtoken";
import { User } from "../db/models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong, while generating the access and refresh tokens"
    );
  }
};

const verifyToken = async (token, secret) => {
  const verifiedAndDecodedUser = jwt.verify(token, secret);

  return verifiedAndDecodedUser;
};

export { generateAccessAndRefreshToken, verifyToken };
