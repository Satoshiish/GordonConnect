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

// Get all forums with comments - no authentication required
export const getForums = (req, res) => {
  console.log("Getting all forums");
  
  const q = `
    SELECT f.*, u.name AS username, u.user_id
    FROM forums f
    JOIN users u ON f.user_id = u.user_id
    ORDER BY f.createdAt DESC
  `;

  db.query(q, [], (err, forums) => {
    if (err) {
      console.error("Database error in getForums:", err);
      return res.status(500).json(err);
    }

    console.log(`Found ${forums.length} forums`);
    
    // If no forums found, return empty array
    if (forums.length === 0) {
      return res.status(200).json([]);
    }

    // Get comments for each forum
    const forumIds = forums.map(forum => forum.forum_id);
    const commentsQuery = `
      SELECT c.*, u.name AS username, u.user_id
      FROM forum_comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.forum_id IN (?)
      ORDER BY c.createdAt ASC
    `;

    db.query(commentsQuery, [forumIds], (err, comments) => {
      if (err) {
        console.error("Error fetching comments:", err);
        // Return forums without comments
        return res.status(200).json(forums.map(forum => ({...forum, comments: []})));
      }

      console.log(`Found ${comments.length} comments for all forums`);
      
      // Group comments by forum_id
      const commentsByForum = {};
      comments.forEach(comment => {
        if (!commentsByForum[comment.forum_id]) {
          commentsByForum[comment.forum_id] = [];
        }
        commentsByForum[comment.forum_id].push(comment);
      });

      // Add comments to each forum
      const forumsWithComments = forums.map(forum => ({
        ...forum,
        comments: commentsByForum[forum.forum_id] || []
      }));

      return res.status(200).json(forumsWithComments);
    });
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
      SELECT f.user_id, u.role
      FROM forums f
      JOIN users u ON u.user_id = ?
      WHERE f.forum_id = ?
    `;
    
    db.query(checkOwnershipQuery, [userInfo.id, req.params.forum_id], (err, data) => {
      if (err) {
        console.error("Database error in deleteForum:", err);
        return res.status(500).json(err);
      }
      
      if (data.length === 0) return res.status(404).json("Forum not found");
      
      const isOwner = data[0].user_id === userInfo.id;
      const isAdmin = data[0].role === "admin";
      
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
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) {
    console.log("No token provided for comment deletion");
    return res.status(401).json("Not authenticated");
  }

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) {
      console.log("Invalid token for comment deletion:", err);
      return res.status(403).json("Token is not valid");
    }

    const { forum_id, comment_id } = req.params;
    console.log(`Attempting to delete comment ${comment_id} from forum ${forum_id}`);

    // Check if user is admin or the comment owner
    const getCommentQuery = `SELECT c.user_id, u.role 
                            FROM forum_comments c 
                            JOIN users u ON u.user_id = ? 
                            WHERE c.comment_id = ?`;
                            
    db.query(getCommentQuery, [userInfo.id, comment_id], (err, data) => {
      if (err) {
        console.error("Database error checking comment ownership:", err);
        return res.status(500).json(err);
      }
      
      if (data.length === 0) {
        console.log("Comment not found or user not found");
        return res.status(404).json("Comment not found");
      }
      
      const commentOwnerId = data[0].user_id;
      const isAdmin = data[0].role === "admin";
      
      if (userInfo.id !== commentOwnerId && !isAdmin) {
        console.log("User not authorized to delete this comment");
        return res.status(403).json("You can only delete your own comments or be an admin");
      }

      console.log("Deleting comment...");
      const deleteQuery = `DELETE FROM forum_comments WHERE comment_id = ?`;
      db.query(deleteQuery, [comment_id], (err, result) => {
        if (err) {
          console.error("Database error deleting comment:", err);
          return res.status(500).json(err);
        }
        
        if (result.affectedRows === 0) {
          console.log("No comment was deleted");
          return res.status(404).json("Comment not found");
        }
        
        console.log("Comment deleted successfully");
        return res.status(200).json("Comment deleted successfully");
      });
    });
  });
};
