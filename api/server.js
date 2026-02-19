require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { createClient } = require("redis");
const authRoutes = require("./routes/auth.js");

const {connectProducer, disconnectProducer} = require("./services/kafka.js")
const engagementRoutes = require("./routes/engagement.js")

const app = express();
app.use(express.json());


app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});


app.use("/auth", authRoutes);
app.use("/engagement", engagementRoutes);

app.listen(3000, "0.0.0.0", () => {
  console.log("API running on port 3000");
});

(async () => {
  await connectProducer();
})();

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await disconnectProducer();
  process.exit(0);
});


// Mongo connection (non-blocking)
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("Mongo Connected"))
.catch(err => console.error("Mongo Error:", err.message));

// Redis connection (non-blocking)
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on("error", err => console.error("Redis Error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis Connected");
  } catch (err) {
    console.error("Redis Connection Failed:", err.message);
  }
})();
