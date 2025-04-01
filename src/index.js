// require("dotenv").config({ path: './env' });
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { logger } from "./modules/logger.js";
import { config } from "./config/default.js";

dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.on("error", (error) => {
      logger.error(
        ` Error thrown::::ERROR during Listening to PORT !!!`,
        error
      );
      process.exit(1);
    });
    app.listen(config.server.port || 9000, () => {
      logger.info(`Server running on port ${config.server.port || 9000}`);
    });
  })
  .catch((error) => {
    logger.error(" Error thrown::::MONGO DB connection FAILED !!! ", error);
  });
