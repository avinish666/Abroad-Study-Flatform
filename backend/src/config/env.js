const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 300,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb+srv://avinish729_db_user:AvinishSubhashKing%40321@cluster0.8limmqa.mongodb.net/waygood-evaluation?retryWrites=true&w=majority&appName=Cluster0",
  port: Number(process.env.PORT) || 4000,
  redisUrl: process.env.REDIS_URL || "",
};
