import express from "express";
// This cookie-parser package is used to perform CRUD operations on the user cookies
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// this configures the the express to accept the json type data upto 16 kb which we have set as limit
app.use(express.json({ limit: "16kb" }));

// when we make a request data which is sent by params sent sent in encoded format and extended checks for the nested objects
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };
