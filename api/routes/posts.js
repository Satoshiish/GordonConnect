import express from "express";
import { getPosts, addPost, deletePost } from "../controllers/post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Allow GET requests without token verification
router.get("/", getPosts);
router.post("/", verifyToken, addPost);
router.delete("/:id", verifyToken, deletePost);

export default router;



