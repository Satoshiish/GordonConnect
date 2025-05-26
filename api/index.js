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

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});
app.use(express.json());
app.use(
  cors({
    origin: "https://gordon-connect.vercel.app",
    credentials: true,
  })
);
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../client/public/upload");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  res.status(200).json(file.filename);
});

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
