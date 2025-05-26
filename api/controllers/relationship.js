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

export const addRelationship = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    const { followedUserId } = req.body;
    
    // First check if relationship already exists
    const checkQuery = "SELECT * FROM relationships WHERE followerUser_id = ? AND followedUser_id = ?";
    
    db.query(checkQuery, [userInfo.id, followedUserId], (err, data) => {
      if (err) return res.status(500).json({ error: "Database error" });
      
      if (data.length > 0) {
        return res.status(200).json({ message: "Already following this user!" });
      }
      
      // If not already following, insert the relationship
      const insertQuery = "INSERT INTO relationships (followerUser_id, followedUser_id) VALUES (?, ?)";
      
      db.query(insertQuery, [userInfo.id, followedUserId], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        return res.status(200).json({ message: "Followed successfully!" });
      });
    });
  });
};

export const deleteRelationship = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    const followedUserId = req.query.followedUserId;
    
    const deleteQuery = "DELETE FROM relationships WHERE followerUser_id = ? AND followedUser_id = ?";
    
    db.query(deleteQuery, [userInfo.id, followedUserId], (err, data) => {
      if (err) return res.status(500).json({ error: "Database error" });
      
      if (data.affectedRows === 0) {
        return res.status(404).json({ error: "Relationship not found" });
      }
      
      return res.status(200).json({ message: "Unfollowed successfully!" });
    });
  });
};
