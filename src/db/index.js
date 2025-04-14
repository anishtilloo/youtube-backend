import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/default.js";

const connectDB = async () => {
  try {
    const db = await mongoose.connect(`${config.db.dbUri}/${DB_NAME}`);
    logger.info(`MongoDB connected !! DB Host:: ${db.connection.host}`);
  } catch (error) {
    logger.error("Error thrown::::MONGODB connection FAILED: ", error);
    process.exit(1);
  }
};

export default connectDB;
