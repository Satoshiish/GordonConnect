import { db } from "../connect.js";
import jwt from "jsonwebtoken";

// Get all bookmarks for a user (with optional postId filtering)
export const getBookmarks = (req, res) => {
  const { postId } = req.query;
  
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Invalid token!" });

    const q = `
        SELECT 
          p.*, 
          u.name AS ownerName
        FROM bookmarks b
        JOIN posts p ON b.post_id = p.posts_id
        JOIN users u ON p.user_id = u.user_id
        WHERE b.user_id = ? ${postId ? "AND b.post_id = ?" : ""}
        ORDER BY b.created_at DESC
      `;

    const queryParams = postId ? [userInfo.id, postId] : [userInfo.id];

    db.query(q, queryParams, (err, data) => {
      if (err) {
        console.error("Error fetching bookmarks:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(200).json(data);
    });
  });
};

// Add or remove bookmark for a post
export const toggleBookmark = (req, res) => {
  const { postId } = req.body;
  
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Invalid token!" });

    // First check if bookmark exists
    const qCheck = "SELECT * FROM bookmarks WHERE user_id = ? AND post_id = ?";
    db.query(qCheck, [userInfo.id, postId], (err, data) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (data.length > 0) {
        // Bookmark exists - remove it
        const qDelete =
          "DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?";
        db.query(qDelete, [userInfo.id, postId], (err) => {
          if (err)
            return res.status(500).json({ error: "Error removing bookmark" });
          return res.status(200).json({
            message: "Bookmark removed",
            bookmarked: false,
          });
        });
      } else {
        // Bookmark doesn't exist - add it
        const qInsert =
          "INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)";
        db.query(qInsert, [userInfo.id, postId], (err) => {
          if (err)
            return res.status(500).json({ error: "Error adding bookmark" });
          return res.status(200).json({
            message: "Bookmark added",
            bookmarked: true,
          });
        });
      }
    });
  });
};

// Get bookmark status for a specific post
export const getBookmarkStatus = (req, res) => {
  const { postId } = req.query;
  
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Invalid token!" });

    const q = `
            SELECT 
                COUNT(*) AS totalBookmarks,
                SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS userBookmarked
            FROM bookmarks
            WHERE post_id = ?
        `;

    db.query(q, [userInfo.id, postId], (err, data) => {
      if (err) return res.status(500).json({ error: "Database error" });

      // Convert to boolean for easier client-side handling
      const result = {
        totalBookmarks: data[0].totalBookmarks,
        isBookmarked: data[0].userBookmarked > 0,
      };

      return res.status(200).json(result);
    });
  });
};
