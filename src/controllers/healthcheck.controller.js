import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
  //TODO: build a healthCheck response that simply returns the OK status as json with a message
  res
    .status(200)
    .json(new ApiResponse(200, "ok", "The server is working fine."));
});

export { healthCheck };
