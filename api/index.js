import express from "express";
const app = express();
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import commentRoutes from "./routes/comments.js";
import likeRoutes from "./routes/likes.js";
import relationshipRoutes from "./routes/relationships.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import eventRoutes from "./routes/events.js";
import bookmarksRoutes from "./routes/bookmarks.js";
import forumRoutes from "./routes/forum.js";
import reportsRoutes from "./routes/reports.js";
import { verifyToken } from "./middleware/auth.js";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});
app.use(cookieParser());

app.use(express.json());
app.use(
  cors({
    origin: "https://gordon-connect.vercel.app",
    credentials: true,
  })
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use a directory that's guaranteed to exist and be writable
    // For Railway, this should be a tmp directory
    cb(null, "/tmp");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Handle file upload errors
app.post("/api/upload", verifyToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Return only the filename
  res.status(200).json(req.file.filename);
});

// Serve uploaded files from the /tmp directory
app.use("/api/upload", express.static("/tmp"));

// Serve default images
app.use("/api/defaults", express.static("./defaults"));

// ✅ Add a route for /api
app.get("/api", (req, res) => {
  res.send("API is working! 🚀");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/forums", forumRoutes);
app.use("/api/reports", reportsRoutes);

app.listen(8800, () => {
  console.log("API is WORKING");
});





