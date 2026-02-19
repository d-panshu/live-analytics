require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { createClient } = require("redis");
const authRoutes = require("./routes/auth.js");
const stream = require("./models/stream.js");
const {connectProducer, disconnectProducer} = require("./services/kafka.js")
const engagementRoutes = require("./routes/engagement.js")
const jwt = require("jsonwebtoken");


const app = express();
app.use(express.json());

app.set("view engine", "ejs");

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);



io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return next(new Error("Unauthorized"));
    }

    socket.user = decoded;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});


app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});


app.use("/auth", authRoutes);
app.use("/engagement", engagementRoutes);
app.get("/admin", (req, res) => {
  res.render("admin");
});

server.listen(3000, "0.0.0.0", () => {
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


mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("Mongo Connected"))
.catch(err => console.error("Mongo Error:", err.message));

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


const subscriber = createClient({
  url: process.env.REDIS_URL
});


(async ()=>{
  await subscriber.connect();
  console.log('redis subsciber connected');

  await subscriber.subscribe("stream-updates", async ()=>{
    console.log("recieve update signal")
    
    const data =await stream.find();

    io.emit("statsUpdate", data);
  })
})();
