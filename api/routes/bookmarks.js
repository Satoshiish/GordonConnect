import express from "express";
import { getBookmarks, toggleBookmark, getBookmarkStatus } from "../controllers/bookmarks.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, getBookmarks);
router.post("/", verifyToken, toggleBookmark);
router.get("/status", verifyToken, getBookmarkStatus);

export default router;
