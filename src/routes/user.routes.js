import express from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js"; 
import uplode from "../middlewares/multer.middleware.js";

const userRouter = express.Router();

userRouter.route("/register").post(
    uplode.fields([
        {
            name: 'avatar',
            maxCount: 1,
        },
        {
            name: 'coverImage',
            maxCount: 1,
        }
    ]),
    registerUser
);

userRouter.route("/login").post(loginUser);

userRouter.route("logout").post(authenticateToken, logoutUser);

export default userRouter;