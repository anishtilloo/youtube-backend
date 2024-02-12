import { verifyToken } from "../modules/token";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

const authenticateToken = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookie?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedUser = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(decodedUser._id).select(
      "-password",
      "-refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "Invalid Access Token!!!");
    }

    req.user = user;
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

export { authenticateToken };
