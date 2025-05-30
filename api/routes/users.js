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

router.get("/findByEmail/:email", verifyToken, (req, res) => {
  const email = req.params.email;
  const q = "SELECT user_id, username, name, profilePic FROM users WHERE email = ?";
  
  db.query(q, [email], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("User not found");
    return res.status(200).json(data[0]);
  });
});

export default router;
