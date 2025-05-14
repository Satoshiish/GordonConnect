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

  const token = req.cookies.accessToken;
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
