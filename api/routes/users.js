import express from "express";
import { getUser, updateUser, getSuggestions, getFriends, getFollowers, getFollowing } from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/find/:userId", getUser);
router.put("/", verifyToken, updateUser);
router.get("/suggestions", verifyToken, getSuggestions);
router.get("/friends", verifyToken, getFriends);
router.get("/followers/:userId", verifyToken, getFollowers);
router.get("/following/:userId", verifyToken, getFollowing);

export default router;
