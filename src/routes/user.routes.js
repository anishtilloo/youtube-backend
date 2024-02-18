import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  getUserChannelProfile,
  changeUserPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserHistory,
} from "../controllers/user.controller.js";
import uplode from "../middlewares/multer.middleware.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter
  .route("/register")
  .post(
    uplode.fields([
      {
        name: "avatar",
        maxCount: 1,
      },
      {
        name: "coverImage",
        maxCount: 1,
      },
    ]),
    registerUser
  );

userRouter
  .route("/login")
  .post(loginUser);

// secured Routes
userRouter
  .route("/logout")
  .post(authenticateToken, logoutUser);
userRouter
  .route("/refresh-token")
  .post(refreshAccessToken);
userRouter
  .route("/change-password")
  .patch(authenticateToken, changeUserPassword);
userRouter
  .route("/profile")
  .get(authenticateToken, getCurrentUser);
userRouter
  .route("/account-details")
  .patch(authenticateToken, updateAccountDetails);
userRouter
  .route("/update-avatar")
  .patch(authenticateToken, uplode.single("avatar"), updateUserAvatar);
userRouter
  .route("update-coverImage")
  .patch(authenticateToken, uplode.single("coverImage"), updateUserCoverImage);
userRouter
  .route("/channel-profile/:userName")
  .get(authenticateToken, getUserChannelProfile);
userRouter
  .route("/watch-history")
  .get(authenticateToken, getUserHistory)

export default userRouter;
