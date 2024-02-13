import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import uplode from "../middlewares/multer.middleware.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.route("/register").post(
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

userRouter.route("/login").post(loginUser);

// secured Routes
userRouter.route("/logout").post(authenticateToken, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

export default userRouter;
