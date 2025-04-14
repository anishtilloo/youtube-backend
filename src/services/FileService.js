import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Assuming Cloudinary helper function exists

class FileService {
    async uploadUserImages(avatarPath, coverPath) {
        // Upload avatar
        const uploadedAvatar = await uploadOnCloudinary(avatarPath);
        if (!uploadedAvatar) {
            throw new ApiError(400, "Avatar file is required");
        }

        // Upload cover image (if provided)
        const uploadedCover = coverPath ? await uploadOnCloudinary(coverPath) : null;

        return { uploadedAvatar, uploadedCover };
    }
}

export default new FileService();