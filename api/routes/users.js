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
  console.log(`Looking up user with email: ${email}`);
  
  // Make sure to trim the email and handle case sensitivity if needed
  const q = "SELECT user_id, username, name, profilePic FROM users WHERE email = ?";
  
  db.query(q, [email.trim()], (err, data) => {
    if (err) {
      console.error("Database error in findByEmail:", err);
      return res.status(500).json(err);
    }
    
    console.log(`Query results for email ${email}:`, data);
    
    if (data.length === 0) {
      console.log(`No user found with email: ${email}`);
      return res.status(404).json("User not found");
    }
    
    return res.status(200).json(data[0]);
  });
});

// Add a more flexible email lookup endpoint as a fallback
router.get("/findByEmailFuzzy/:email", verifyToken, (req, res) => {
  const email = req.params.email;
  console.log(`Looking up user with fuzzy email match: ${email}`);
  
  // Case-insensitive search
  const q = "SELECT user_id, username, name, profilePic FROM users WHERE LOWER(email) = LOWER(?)";
  
  db.query(q, [email.trim()], (err, data) => {
    if (err) {
      console.error("Database error in findByEmailFuzzy:", err);
      return res.status(500).json(err);
    }
    
    if (data.length === 0) {
      console.log(`No user found with fuzzy email match: ${email}`);
      return res.status(404).json("User not found");
    }
    
    return res.status(200).json(data[0]);
  });
});

export default router;
