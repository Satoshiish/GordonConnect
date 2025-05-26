import { db } from "../connect.js";
import jwt from "jsonwebtoken";

// Create a forum - allow both admins and regular users
export const createForum = (req, res) => {
  // Use userInfo from middleware
  const userInfo = req.userInfo;

  // Check if user is a guest
  const q = "SELECT role FROM users WHERE user_id = ?";
  db.query(q, [userInfo.id], (err, data) => {
    if (err) return res.status(500).json(err);
    
    if (data.length === 0) return res.status(404).json("User not found");
    
    if (data[0].role === "guest") {
      return res.status(403).json("Guests cannot create forums");
    }

    // If not a guest, proceed with forum creation
    const insertQuery = `
      INSERT INTO forums (title, description, image, createdAt, user_id)
      VALUES (?, ?, ?, NOW(), ?)
    `;

    const values = [
      req.body.title,
      req.body.description,
      req.body.image || null,
      userInfo.id
    ];

    db.query(insertQuery, values, (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(201).json("Forum created successfully");
    });
  });
};

// Get all forums with their comments
export const getForums = (req, res) => {
  const q = `
    SELECT 
      f.forum_id, f.title, f.description, f.createdAt, f.image,
      u.name AS username, 
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
      const {
        forum_id,
        title,
        description,
        createdAt,
        username,
        comment_id,
        comment,
        comment_user_id,
        comment_createdAt,
        comment_username,
      } = row;

      if (!acc[forum_id]) {
        acc[forum_id] = {
          forum_id,
          title,
          description,
          createdAt,
          username,
          image: row.image,
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
  // Use userInfo from middleware
  const userInfo = req.userInfo;
  
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
};

// Delete a forum (Admin or owner only)
export const deleteForum = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    // First check if the user is the owner of the forum or an admin
    const checkOwnershipQuery = `
      SELECT user_id, 
             (SELECT role FROM users WHERE user_id = ?) as user_role 
      FROM forums 
      WHERE forum_id = ?
    `;
    
    db.query(checkOwnershipQuery, [userInfo.id, req.params.forum_id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("Forum not found");
      
      const isOwner = data[0].user_id === userInfo.id;
      const isAdmin = data[0].user_role === "admin";
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json("You can only delete your own forums or be an admin");
      }

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
