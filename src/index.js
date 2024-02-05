// require("dotenv").config({ path: './env' });
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error(
        ` Error thrown::::ERROR during Listening to PORT !!!`,
        error
      );
      process.exit(1);
    });
    app.listen(process.env.PORT || 9000, () => {
      console.log(` Server running on port ${process.env.PORT || 9000}`);
    });
  })
  .catch((error) => {
    console.error(" Error thrown::::MONGO DB connection FAILED !!! ", error);
  });
