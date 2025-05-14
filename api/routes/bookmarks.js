import express from "express";
import { getBookmarks, toggleBookmark } from "../controllers/bookmarks.js"; // Import toggleBookmark

const router = express.Router();

router.get("/", getBookmarks);  // To get bookmarks for the user
router.post("/", toggleBookmark);  // To toggle (add/remove) a bookmark

export default router;
