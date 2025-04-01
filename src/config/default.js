export const config = {
    nodeEnv: process.env.NODE_ENV,
    crossOrigin: process.env.CORS_ORIGIN,
    server: {
        port: Number(process.env.PORT),
        host: process.env.HOST,
    },
    token: {
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    },
    db: {
        dbUri: process.env.MONGODB_URI,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        apiKey: process.env.CLOUDINARY_API_KEY,
    },
    enableLogs: JSON.parse(process.env.ENABLE_LOGS),
    storeLogs: JSON.parse(process.env.STORE_LOGS),
}