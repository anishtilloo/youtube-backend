import { User } from "../models/user.model.js";

class UserDAO {
    // 🔹 Find a user by ID but exclude sensitive fields
    async findUserById(userId) {
        return await User.findById(userId).select("-password -refreshToken");
    }

    // 🔹 Check if a user exists by email or username
    async findUserByEmailOrUsername(email, userName) {
        return await User.findOne({
            $or: [{ email }, { userName }],
        });
    }

    // 🔹 Creating the user
    async createUser(data) {
        return await User.create(data);
    }

    // 🔹 Find the user by Id and Update (removes the refreshToken fields)
    async findUserByIdAndUpdate(userId) {
        await User.findByIdAndUpdate(
            userId,
            {
                // $set: {
                //   refreshToken: undefined, // undefined in update query ignores the field and does nothing to it
                //   // and when we set it to null it actually set the value of that field to null
                // },
                $unset: {
                    refreshToken: 1, // removes the field from the document
                },
            },
            {
                // by default this function returns the object as it was before update but the new: true return the object which is updated
                new: true,
            }
        );
    }

    // 🔹 Find the user by Id and Update fields passed as params
    async findUserByIdAndUpdate(userId, ...userFieldsParams) {
        return await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    ...userFieldsParams,
                },
            },
            {
                new: true,
            }
        ).select("-password -refreshToken");
    }

    // 🔹 Fetch the subscriber count and subscribed to count with the basic user details
    async getUserChannelProfile(userId, userName) {
        return await User.aggregate([
            {
              $match: { userName },
            },
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "channel_subscribers",
              },
            },
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channel_subscribed_to",
              },
            },
            {
              $addFields: {
                channelSubscribersCount: {
                  $size: "$channel_subscribers",
                },
                channelSubscribedToCount: {
                  $size: "$channel_subscribed_to",
                },
                isSubscribed: {
                  $cond: {
                    if: { $in: [userId, "$channel_subscribed_to.subscriber"] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                fullName: 1,
                userName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                channelSubscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
              },
            },
          ]);
    }

    // 🔹 Fetch the user channel history
    async getUserChannelHistory() {
        return await User.aggregate([
            {
              $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                  // write sub pipeline using pipeline
                  {
                    $lookup: {
                      //inside the videos table there is owner which is linked to the users to to add values to it we are using lookup here
                      from: "users",
                      localField: "owner",
                      foreignField: "_id",
                      as: "owner",
                      pipeline: [
                        // to add more pipelines inside inside it we are using pipeline
                        {
                          $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1,
                            coverImage: 1,
                          },
                        },
                      ],
                    },
                  },
                  {
                    $addFields: {
                      owner: {
                        $first: "$owner",
                      },
                    },
                  },
                ],
              },
            },
          ]);
        
    }
}

export default new UserDAO();