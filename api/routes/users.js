import express from "express";
import { getUser, updateUser, getSuggestions, getFriends, getFollowers, getFollowing } from "../controllers/users.js"

const router = express.Router()

router.get("/find/:userId", getUser)
router.put("/", updateUser)
router.get("/suggestions", getSuggestions);
router.get("/friends", getFriends);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);

export default router