import express from "express";
import { createForum, getForums, deleteForum, postComment, deleteForumComment } from "../controllers/forum.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET all forums with comments
router.get("/", getForums);

// POST create a new forum (admin only)
router.post("/", verifyToken, createForum);

// POST comment on a forum
router.post("/:forum_id/comments", verifyToken, postComment);

// DELETE a forum (admin only)
router.delete("/:forum_id", verifyToken, deleteForum);

// DELETE a forum comment
router.delete('/:forum_id/comments/:comment_id', verifyToken, deleteForumComment);

export default router;
