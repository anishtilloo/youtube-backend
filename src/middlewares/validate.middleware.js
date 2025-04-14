import { ApiError } from "../utils/ApiError.js";

function validateRegisteringUser(req, res, next) {
    const { fullName, userName, email, password } = req.body;

    // 🔹 Check if all required fields are provided
    // here we are checking even after trimming the fields if they are empty throw an error
    // here some function works loops through the array checking the condition and returning a Boolean true or false
    // even if one of the condition is true it will return and throw an error
    if (
        [fullName, userName, email, password].some((field) => field?.trim() === "")
    ) {
        return next(new ApiError(400, "Bad Request: All fields are required"));
    }

    // 🔹 Proceed to the next middleware/controller
    next();
};

function validateLoggingUser(req, res, next) {
    const { userName, email, password } = req.body;

    // 🔹 Check if all required fields are provided
    if (!userName && !email) {
        throw new ApiError(404, "Either username or email is required");
    }
    if (!password) {
        throw new ApiError(404, "Password is required");
    }

    // 🔹 Proceed to the next middleware/controller
    next();
}

function validateRefreshToken(req, res, next) {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }

    // 🔹 Proceed to the next middleware/controller
    next();
}

function validateChangingPassword(req, res, next) {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        throw new ApiError(401, "New and Confirm Password do not match");
    }

    // 🔹 Proceed to the next middleware/controller
    next();
}

function validateAccountDetails(req, res, next) {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
    throw new ApiError(400, "At least one field should be provided");
    }
}

function validateFiles(req, res, next) {
    const avatarLocalFilePath = req.files?.avatar[0]?.path;

    if (!avatarLocalFilePath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 🔹 Proceed to the next middleware/controller
    next();
}

export {
    validateRegisteringUser,
    validateLoggingUser,
    validateRefreshToken,
    validateChangingPassword,
    validateAccountDetails,
    validateFiles,
}
    