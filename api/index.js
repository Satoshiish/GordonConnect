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
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a directory for uploads if it doesn't exist
import fs from 'fs';
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create a directory for default images if it doesn't exist
const defaultsDir = path.join(__dirname, 'defaults');
if (!fs.existsSync(defaultsDir)) {
  fs.mkdirSync(defaultsDir, { recursive: true });
}

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

// Configure multer to store files in the uploads directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Handle file upload
app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, function (err) {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Return just the filename, not the full path
    res.status(200).json(req.file.filename);
  });
});

// Serve uploaded files
app.use("/api/upload", express.static(uploadDir));

// Serve default images
app.use("/api/defaults", express.static(defaultsDir));

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





