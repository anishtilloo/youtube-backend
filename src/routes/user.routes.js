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
import upload from "../middlewares/multer.middleware.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { 
  validateRegisteringUser,
  validateLoggingUser,
  validateRefreshToken,
  validateChangingPassword,
  validateAccountDetails,
  validateFiles 
} from "../middlewares/validate.middleware.js";

const userRouter = express.Router();

userRouter
  .route("/register")
  .post(
    upload.fields([
      {
        name: "avatar",
        maxCount: 1,
      },
      {
        name: "coverImage",
        maxCount: 1,
      },
    ]),
    validateRegisteringUser,
    validateFiles,
    registerUser
  );

userRouter
  .route("/login")
  .post(
    validateLoggingUser, 
    loginUser,
  );

// secured Routes
userRouter
  .route("/logout")
  .post(
    authenticateToken,
    logoutUser,
  );
userRouter
  .route("/refresh-token")
  .post(
    validateRefreshToken,
    refreshAccessToken,
  );
userRouter
  .route("/change-password")
  .patch(
    authenticateToken,
    validateChangingPassword,
    changeUserPassword,
  );
userRouter
  .route("/profile")
  .get(
    authenticateToken,
    getCurrentUser,
  );
userRouter
  .route("/account-details")
  .patch(
    authenticateToken,
    validateAccountDetails,
    updateAccountDetails,
  );
userRouter
  .route("/update-avatar")
  .patch(
    authenticateToken, 
    upload.single("avatar"),
    updateUserAvatar,
  );
userRouter
  .route("update-coverImage")
  .patch(
    authenticateToken,
    upload.single("coverImage"),
    updateUserCoverImage,
  );
userRouter
  .route("/channel-profile/:userName")
  .get(
      authenticateToken,
      getUserChannelProfile,
    );
userRouter
  .route("/watch-history")
  .get(
    authenticateToken,
    getUserHistory,
  )

export default userRouter;
