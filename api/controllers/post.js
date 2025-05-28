import moment from "moment";
import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import util from 'util';

export const getPosts = async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;
    
    // Get query parameters
    const userId = req.query.userId; 
    const category = req.query.category;
    const anyCategory = req.query.anyCategory;
    const postId = req.query.postId;
    
    // Handle guest users or users with valid tokens
    let userInfo = { id: 'guest', role: 'guest' }; // Default to guest
    
    if (token && !token.startsWith('guest_')) {
      try {
        // Only verify if it's not a guest token
        userInfo = jwt.verify(token, "secretkey");
      } catch (err) {
        console.log("Token verification failed, using guest access:", err.message);
        // Continue as guest if token verification fails
      }
    } else if (token && token.startsWith('guest_')) {
      // Already set default userInfo as guest
      console.log("Using guest token");
    } else {
      console.log("No token found, using guest access");
    }

    // Define query and values
    let q, values = [];

    // Specific post by ID
    if (postId) {
      q = `
        SELECT p.*, u.user_id AS userId, u.name, u.profilePic
        FROM posts AS p 
        JOIN users AS u ON (u.user_id = p.user_id)
        WHERE p.posts_id = ?
      `;
      values = [postId];
    }
    // User's posts
    else if (userId) {
      q = `
        SELECT p.*, u.user_id AS userId, u.name, u.profilePic
        FROM posts AS p 
        JOIN users AS u ON (u.user_id = p.user_id)
        WHERE p.user_id = ?
        ORDER BY p.createdAt DESC
      `;
      values = [userId];
    }
    // All posts (with optional category filter)
    else {
      // Simplified query that works for both guests and logged-in users
      if (anyCategory) {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          WHERE p.category = ? OR p.category2 = ? OR p.category3 = ? OR p.category4 = ?
          ORDER BY p.createdAt DESC
        `;
        values = [anyCategory, anyCategory, anyCategory, anyCategory];
      } else {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          ORDER BY p.createdAt DESC
        `;
      }
    }

    // Execute the query with proper error handling
    db.query(q, values, (err, data) => {
      if (err) {
        console.error("Database error in getPosts:", err);
        return res.status(500).json({
          error: "Database error", 
          message: err.message,
          code: err.code
        });
      }
      
      // Return empty array if no data
      return res.status(200).json(data || []);
    });
  } catch (error) {
    console.error("Error in getPosts:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
};

export const addPost = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Check if user is admin
    const checkUserQuery = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkUserQuery, [userInfo.id], (err, userData) => {
      if (err) {
        console.error("Database error checking user role:", err);
        return res.status(500).json("Database error");
      }
      
      if (userData.length === 0) return res.status(404).json("User not found!");
      
      const userRole = userData[0].role;
      
      // Only allow admins to post
      if (userRole !== "admin") {
        return res.status(403).json("Only admin users can create posts!");
      }
      
      // Proceed with post creation
      const q =
        "INSERT INTO posts (`desc`, `img`, `createdAt`, `user_id`, `category`, `category2`, `category3`, `category4`, `visible`) VALUES (?)";

      const values = [
        req.body.desc,
        req.body.img,
        moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
        userInfo.id,
        req.body.category,
        req.body.category2,
        req.body.category3,
        req.body.category4,
        req.body.visible !== undefined ? req.body.visible : 1,
      ];

      db.query(q, [values], (err, data) => {
        if (err) {
          console.error("Database error creating post:", err);
          return res.status(500).json("Database error");
        }
        return res.status(200).json("Post has been created!");
      });
    });
  });
};

export const deletePost = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = "DELETE FROM posts WHERE `posts_id` = ? AND `user_id` = ?";

    db.query(q, [req.params.id, userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.affectedRows > 0)
        return res.status(200).json("Post has been deleted!");
      return res.status(403).json("You can only delete your own post");
    });
  });
};

// Add a new function to update post visibility
export const updatePostVisibility = (req, res) => {
  const { visible } = req.body;
  const postId = req.params.id;
  
  // Ensure the visible parameter is provided
  if (visible === undefined) {
    return res.status(400).json({ error: "Visibility parameter is required" });
  }
  
  // Update the post's visibility status
  const q = "UPDATE posts SET visible = ? WHERE posts_id = ?";
  
  db.query(q, [visible ? 1 : 0, postId], (err, result) => {
    if (err) {
      console.error("Error updating post visibility:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Post visibility updated to ${visible ? 'visible' : 'hidden'}`
    });
  });
};







