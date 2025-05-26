import express from "express";
import { getLikes, addLike, deleteLike } from "../controllers/likes.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, getLikes);
router.post("/", verifyToken, addLike);
router.delete("/", verifyToken, deleteLike);

export default router
