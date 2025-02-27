const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const colors = require("colors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const http = require("http");
const { Server } = require("socket.io");

// Load environment variables from .env file
dotenv.config();

// Ensure MONGO_URI is loaded correctly
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not defined in .env file");
  process.exit(1); // Exit the app if MONGO_URI is not defined
}

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware to parse JSON requests
app.use(express.json());

// Define API Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// -------------------------- Deployment ------------------------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

// -------------------------- Deployment ------------------------------

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Define PORT
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}...`.yellow.bold);
});

// -------------------------- Socket.io Setup ------------------------------
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000", // Change this if deploying
  },
});

io.on("connection", (socket) => {
  console.log("⚡ Connected to socket.io");

  socket.on("setup", (userData) => {
    if (!userData || !userData._id) {
      console.log("❌ Invalid user data in setup event");
      return;
    }
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`📌 User joined room: ${room}`);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat || !chat.users) {
      console.log("❌ chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected");
  });

  socket.on("setup", (userData) => {
    if (userData && userData._id) {
      socket.leave(userData._id);
    }
    console.log("👤 User disconnected from setup");
  });
});
