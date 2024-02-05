import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const db = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n MongoDB connected !! DB Host:: ${db.connection.host}`);
  } catch (error) {
    console.error(" Error thrown::::MONGODB connection FAILED: ", error);
    process.exit(1);
  }
};

export default connectDB;
