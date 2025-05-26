import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getLikes = (req, res) => {
  const q = `
    SELECT COUNT(*) AS totalLikes, 
           SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS userLiked 
    FROM likes 
    WHERE posts_id = ?
  `;

  db.query(q, [req.userInfo.id, req.query.postId], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }
    return res.status(200).json(data[0]);
  });
};

export const addLike = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });
    const postId = req.body.postId;
    if (!postId) return res.status(400).json({ error: "postId is required!" });

    const checkQuery = "SELECT * FROM likes WHERE user_id = ? AND posts_id = ?";
    db.query(checkQuery, [userInfo.id, postId], (err, data) => {
      if (err) {
        return res.status(500).json({ error: "Database error", details: err });
      }
      if (data.length > 0) {
        return res.status(400).json({ error: "You already liked this post!" });
      }
      const insertQuery = "INSERT INTO likes (user_id, posts_id) VALUES (?, ?)";
      db.query(insertQuery, [userInfo.id, postId], (err, data) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Database error", details: err });
        }
        return res.status(200).json({ message: "Post has been liked." });
      });
    });
  });
};

export const deleteLike = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    const postId = req.query.postId;
    if (!postId) return res.status(400).json({ error: "postId is required!" });

    const deleteQuery = "DELETE FROM likes WHERE user_id = ? AND posts_id = ?";
    db.query(deleteQuery, [userInfo.id, postId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error", details: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "No like found" });
      }
      return res.status(200).json({ message: "Like removed." });
    });
  });
};
