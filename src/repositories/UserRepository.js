import UserDAO from "../db/dao/UserDAO.js";
import { ApiError } from "../utils/ApiError.js";
import FileService from "../services/FileService.js";
import { generateAccessAndRefreshToken } from "../services/TokenService.js";

class UserRepository {
    async registerUser(userData, fileData) {
        const { fullName, userName, email, password } = userData;
        const existedUser = await UserDAO.findUserByEmailOrUsername(email, userName);

        if (existedUser) {
            throw new ApiError(400, "User with this email or username already exist");
        }
        const { avatarLocalFilePath, coverImageLocalFilePath } = fileData;

        const uploadedFiles = await FileService.uploadUserImages(avatarLocalFilePath, coverImageLocalFilePath);

        const user = await UserDAO.createUser({
            fullName,
            avatar: uploadedFiles.uploadedAvatar.url,
            coverImage: uploadedFiles.uploadedCover?.url || "",
            email,
            password,
            userName: userName.toLowerCase(),
        });

        // here we are removing the the password and refreshToken from the response
        // to send that response to the user
        const createdUser = await UserDAO.findUserById(user._id);

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return createdUser;
    }

    async loginUser(userData) {
        const { userName, email, password } = userData;
        const user = await UserDAO.findUserByEmailOrUsername(email, userName);

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

        // here we are removing the the password and refreshToken from the response
        // to send that response to the user
        const loggedInUser = await UserDAO.findUserById(user._id);
        
        return {
            user: loggedInUser,
            accessToken,
            refreshToken,
        }
    }

    async logoutUser(userId) {
        await UserDAO.findUserByIdAndUpdate(userId);
    }

    async refreshToken(incomingRefreshToken) {
        const decodedToken = await verifyToken(
              incomingRefreshToken,
              process.env.REFRESH_TOKEN_SECRET
            );
        const user = await UserDAO.findUserById(decodedToken?._id);

        if (!user) {
            throw new ApiError(404, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired, or used");
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshToken(user._id);

        return {
            accessToken,
            refreshToken: newRefreshToken,
        }
    }

    async changeUserPassword(passwords, userId) {
        const { oldPassword, newPassword } = passwords;
          // we are getting req.user from the middleware we attached as authentication where we are doing
          // req.user = user where user is fetched using the id which we get from the decoded token
        const user = await UserDAO.findUserById(userId);

        const isPasswordValid = user.isPasswordCorrect(oldPassword);

        if (!isPasswordValid) {
            throw new ApiError(400, "Invalid Old Password");
        }

        user.password = newPassword;
        await UserDAO.saveUser(user, false);
    }

    async updateAccountDetails(accountData, userId) {
        return UserDAO.findUserByIdAndUpdate(userId, ...accountData);
    }
}

export default new UserRepository();