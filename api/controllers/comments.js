import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import moment from "moment";

export const getComments = (req, res) => {
  const q = `
       SELECT c.*, u.user_id AS userId, u.name, u.profilePic 
       FROM comments AS c 
       JOIN users AS u ON (u.user_id = c.user_id)
       WHERE c.posts_id = ?
       ORDER BY c.createdAt DESC;
       `;
  db.query(q, [req.query.postId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const addComment = (req, res) => {
  console.log("Received request to add comment:", req.body); // Debug log

  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) {
    console.log("No token found!");
    return res.status(401).json({ error: "Not logged in!" });
  }

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) {
      console.log("Invalid token!");
      return res.status(403).json({ error: "Token is not valid!" });
    }

    // Check if `desc` and `postId` exist before proceeding
    if (!req.body.desc || !req.body.postId) {
      console.log("Error: Missing comment description or postId!");
      return res
        .status(400)
        .json({ error: "Comment description and postId are required!" });
    }

    const q =
      "INSERT INTO comments (`desc`, `createdAt`, `user_id`, `posts_id`) VALUES (?)";

    const values = [
      req.body.desc.trim(), // Ensure no leading/trailing spaces
      moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      userInfo.id,
      req.body.postId,
    ];

    console.log("Attempting to insert into DB:", values); // Debug log

    db.query(q, [values], (err, data) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error", details: err });
      }
      return res.status(200).json({ message: "Comment has been created!" });
    });
  });
};

export const deleteComment = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    const { commentId } = req.params;

    // Check if user is admin or the comment owner
    const getCommentQuery = `SELECT user_id FROM comments WHERE comments_id = ?`;
    db.query(getCommentQuery, [commentId], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("Comment not found");
      const commentOwnerId = data[0].user_id;

      const getUserRoleQuery = `SELECT role FROM users WHERE user_id = ?`;
      db.query(getUserRoleQuery, [userInfo.id], (err, userData) => {
        if (err) return res.status(500).json(err);
        const isAdmin = userData[0]?.role === "admin";
        if (userInfo.id !== commentOwnerId && !isAdmin) {
          return res.status(403).json("You can only delete your own comments or be an admin.");
        }

        const deleteQuery = `DELETE FROM comments WHERE comments_id = ?`;
        db.query(deleteQuery, [commentId], (err, result) => {
          if (err) return res.status(500).json(err);
          return res.status(200).json("Comment deleted successfully");
        });
      });
    });
  });
};
