import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getRelationships = (req, res) => {
  const { followedUserId } = req.query;
  if (!followedUserId) {
    return res.status(400).json({ error: "Missing followedUserId parameter" });
  }

  const q =
    "SELECT followerUser_id FROM relationships WHERE followedUser_id = ?";
  db.query(q, [followedUserId], (err, data) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });

    return res.status(200).json({
      totalLikes: data.length,
      users: data.map((relationship) => relationship.followerUser_id),
    });
  });
};

export const addRelationships = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    const { followedUserId } = req.body;
    const insertQuery =
      "INSERT INTO relationships (followerUser_id, followedUser_id) VALUES (?, ?)";
    db.query(insertQuery, [userInfo.id, followedUserId], (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      return res.status(200).json({ message: "Followed successfully!" });
    });
  });
};

export const deleteRelationships = (req, res) => {
  console.log("📥 Received request to unfollow:", req.query);

  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    const { followedUserId } = req.query;
    if (!followedUserId)
      return res.status(400).json({ error: "followedUserId is required!" });

    const deleteQuery =
      "DELETE FROM relationships WHERE followerUser_id = ? AND followedUser_id = ?";
    db.query(deleteQuery, [userInfo.id, followedUserId], (err, result) => {
      if (err)
        return res.status(500).json({ error: "Database error", details: err });

      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Follow relationship not found" });

      console.log("✅ Successfully unfollowed user!");
      return res.status(200).json({ message: "Successfully unfollowed user." });
    });
  });
};