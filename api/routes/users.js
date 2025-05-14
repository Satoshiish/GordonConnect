import express from "express";
import { getUser, updateUser, getSuggestions, getFriends } from "../controllers/users.js"

const router = express.Router()

router.get("/find/:userId", getUser)
router.put("/", updateUser)
router.get("/suggestions", getSuggestions);
router.get("/friends", getFriends);

export default router