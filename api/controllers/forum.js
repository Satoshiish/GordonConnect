import { db } from "../connect.js";
import jwt from "jsonwebtoken";

// Create a forum
export const createForum = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    const q = "SELECT role FROM users WHERE user_id = ?";
    db.query(q, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data[0].role !== "admin")
        return res.status(403).json("Only admins can create forums");

      const insertQuery = `
        INSERT INTO forums (title, description, createdAt, user_id)
        VALUES (?, ?, NOW(), ?)
      `;
      db.query(
        insertQuery,
        [req.body.title, req.body.description, userInfo.id],
        (err, data) => {
          if (err) return res.status(500).json(err);
          return res.status(201).json("Forum created successfully");
        }
      );
    });
  });
};

// Get all forums with their comments
export const getForums = (req, res) => {
  const q = `
    SELECT f.forum_id, f.title, f.description, f.createdAt, u.name AS username, 
    c.comment_id, c.comment, c.user_id AS comment_user_id, c.createdAt AS comment_createdAt, 
    u2.name AS comment_username,
    COALESCE(SUM(fv.vote_value), 0) AS vote_count
    FROM forums f
    LEFT JOIN users u ON f.user_id = u.user_id
    LEFT JOIN forum_comments c ON f.forum_id = c.forum_id
    LEFT JOIN users u2 ON c.user_id = u2.user_id
    LEFT JOIN forum_votes fv ON f.forum_id = fv.forum_id
    GROUP BY f.forum_id, c.comment_id
    ORDER BY f.createdAt DESC, c.createdAt ASC;
  `;
  
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);

    // Group comments by forum_id
    const forums = data.reduce((acc, row) => {
      const { forum_id, title, description, createdAt, username, comment_id, comment, comment_user_id, comment_createdAt, comment_username } = row;

      if (!acc[forum_id]) {
        acc[forum_id] = {
          forum_id,
          title,
          description,
          createdAt,
          username,
          comments: [],
        };
      }

      if (comment_id) {
        acc[forum_id].comments.push({
          comment_id,
          comment,
          user_id: comment_user_id,
          createdAt: comment_createdAt,
          username: comment_username,
        });
      }

      return acc;
    }, {});

    // Convert forums object to an array
    const forumList = Object.values(forums);
    return res.status(200).json(forumList);
  });
};

// Post a comment on a forum
export const postComment = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    const { comment } = req.body;
    const { forum_id } = req.params;

    if (!comment) return res.status(400).json("Comment cannot be empty");

    const insertQuery = `
      INSERT INTO forum_comments (forum_id, user_id, comment)
      VALUES (?, ?, ?)
    `;
    
    db.query(insertQuery, [forum_id, userInfo.id, comment], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(201).json("Comment posted successfully");
    });
  });
};

// Delete a forum (Admin only)
export const deleteForum = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    const q = "SELECT role FROM users WHERE user_id = ?";
    db.query(q, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data[0].role !== "admin")
        return res.status(403).json("Only admins can delete forums");

      // First, delete all related comments
      const deleteCommentsQuery = `DELETE FROM forum_comments WHERE forum_id = ?`;
      db.query(deleteCommentsQuery, [req.params.forum_id], (err) => {
        if (err) return res.status(500).json(err);

        // Now, delete the forum
        const deleteForumQuery = `DELETE FROM forums WHERE forum_id = ?`;
        db.query(deleteForumQuery, [req.params.forum_id], (err, result) => {
          if (err) return res.status(500).json(err);
          return res.status(200).json("Forum deleted successfully");
        });
      });
    });
  });
};
