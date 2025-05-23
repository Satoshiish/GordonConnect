import { db } from "../connect.js";
import jwt from "jsonwebtoken";

// Create a forum - Allow all registered users (not guests) to create forums
export const createForum = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    // Check if user is a guest
    const checkUserRoleQuery = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkUserRoleQuery, [userInfo.id], (err, userData) => {
      if (err) return res.status(500).json(err);
      
      if (userData[0]?.role === "guest") {
        return res.status(403).json("Guests cannot create forums");
      }
      
      // Allow all non-guest users to create forums
      const insertQuery = `
        INSERT INTO forums (title, description, image, createdAt, user_id)
        VALUES (?, ?, ?, NOW(), ?)
      `;

      const { title, description, image } = req.body;

      db.query(
        insertQuery,
        [title, description, image || null, userInfo.id],
        (err, result) => {
          if (err) return res.status(500).json(err);
          return res.status(201).json("Forum created successfully");
        }
      );
    });
  });
};

// Get all forums with comments
export const getForums = (req, res) => {
  const q = `
    SELECT f.*, u.username, u.profilePic,
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'comment_id', fc.comment_id,
          'forum_id', fc.forum_id,
          'user_id', fc.user_id,
          'username', (SELECT username FROM users WHERE user_id = fc.user_id),
          'comment', fc.comment,
          'createdAt', fc.createdAt
        )
      )
      FROM forum_comments fc
      WHERE fc.forum_id = f.forum_id
      ORDER BY fc.createdAt DESC
    ) as comments
    FROM forums f
    JOIN users u ON f.user_id = u.user_id
    ORDER BY f.createdAt DESC
  `;

  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    
    // Parse the JSON string for comments
    const forumsWithComments = data.map(forum => {
      return {
        ...forum,
        comments: forum.comments ? JSON.parse(forum.comments) : []
      };
    });
    
    return res.status(200).json(forumsWithComments);
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

// Delete a forum (Admin or post owner)
export const deleteForum = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    const forumId = req.params.forum_id;
    
    // First check if user is admin or the forum owner
    const checkOwnershipQuery = `
      SELECT user_id, (SELECT role FROM users WHERE user_id = ?) as userRole 
      FROM forums 
      WHERE forum_id = ?
    `;
    
    db.query(checkOwnershipQuery, [userInfo.id, forumId], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("Forum not found");
      
      const isAdmin = data[0].userRole === "admin";
      const isOwner = data[0].user_id === userInfo.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json("You can only delete your own forums or be an admin");
      }
      
      // First, delete all related comments
      const deleteCommentsQuery = `DELETE FROM forum_comments WHERE forum_id = ?`;
      db.query(deleteCommentsQuery, [forumId], (err) => {
        if (err) return res.status(500).json(err);

        // Now, delete the forum
        const deleteForumQuery = `DELETE FROM forums WHERE forum_id = ?`;
        db.query(deleteForumQuery, [forumId], (err, result) => {
          if (err) return res.status(500).json(err);
          return res.status(200).json("Forum deleted successfully");
        });
      });
    });
  });
};

// Delete a comment from a forum
export const deleteForumComment = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    const { forum_id, comment_id } = req.params;

    // Check if user is admin or the comment owner
    const getCommentQuery = `SELECT user_id FROM forum_comments WHERE comment_id = ? AND forum_id = ?`;
    db.query(getCommentQuery, [comment_id, forum_id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("Comment not found");
      const commentOwnerId = data[0].user_id;

      const getUserRoleQuery = `SELECT role FROM users WHERE user_id = ?`;
      db.query(getUserRoleQuery, [userInfo.id], (err, userData) => {
        if (err) return res.status(500).json(err);
        const isAdmin = userData[0]?.role === "admin";
        if (userInfo.id !== commentOwnerId && !isAdmin) {
          return res
            .status(403)
            .json("You can only delete your own comments or be an admin.");
        }

        const deleteQuery = `DELETE FROM forum_comments WHERE comment_id = ? AND forum_id = ?`;
        db.query(deleteQuery, [comment_id, forum_id], (err, result) => {
          if (err) return res.status(500).json(err);
          return res.status(200).json("Comment deleted successfully");
        });
      });
    });
  });
};
