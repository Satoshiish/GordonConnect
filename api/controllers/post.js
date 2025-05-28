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
  try {
    // Check for token in cookies or Authorization header
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;
    
    if (!token) return res.status(401).json("Not authenticated!");

    // Validate required fields
    const { desc, category } = req.body;
    
    if (!desc) {
      console.log("Missing required field: desc");
      return res.status(400).json("Post description is required");
    }
    
    if (!category) {
      console.log("Missing required field: category");
      return res.status(400).json("At least one category is required");
    }
    
    // Log the request body for debugging
    console.log("Post creation request:", {
      desc: req.body.desc,
      img: req.body.img ? "Image provided" : "No image",
      category: req.body.category,
      category2: req.body.category2,
      category3: req.body.category3,
      category4: req.body.category4,
    });

    jwt.verify(token, "secretkey", (err, userInfo) => {
      if (err) {
        console.error("Token verification failed:", err);
        return res.status(403).json("Token is not valid!");
      }

      // Check if user is admin
      const checkUserQuery = "SELECT role FROM users WHERE user_id = ?";
      db.query(checkUserQuery, [userInfo.id], (err, userData) => {
        if (err) {
          console.error("Database error checking user role:", err);
          return res.status(500).json({
            error: "Database error",
            message: "Failed to verify user role",
            details: err.message
          });
        }
        
        if (userData.length === 0) {
          console.log("User not found:", userInfo.id);
          return res.status(404).json("User not found!");
        }
        
        const userRole = userData[0].role;
        
        // Only allow admins to post
        if (userRole !== "admin") {
          console.log("Non-admin attempted to create post:", userInfo.id, userRole);
          return res.status(403).json("Only admin users can create posts!");
        }
        
        // Proceed with post creation
        const q =
          "INSERT INTO posts (`desc`, `img`, `createdAt`, `user_id`, `category`, `category2`, `category3`, `category4`, `visible`) VALUES (?)";

        const values = [
          req.body.desc,
          req.body.img || null, // Handle null image
          moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
          userInfo.id,
          req.body.category,
          req.body.category2 || null,
          req.body.category3 || null,
          req.body.category4 || null,
          req.body.visible !== undefined ? req.body.visible : 1,
        ];

        // Log the SQL values for debugging
        console.log("Inserting post with values:", JSON.stringify(values));

        db.query(q, [values], (err, data) => {
          if (err) {
            console.error("Database error creating post:", err);
            
            // Check for specific error types
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
              return res.status(400).json({
                error: "Invalid reference",
                message: "One of the referenced values does not exist in the database"
              });
            } else if (err.code === 'ER_DATA_TOO_LONG') {
              return res.status(400).json({
                error: "Data too long",
                message: "One of the fields exceeds the maximum allowed length"
              });
            } else {
              return res.status(500).json({
                error: "Database error",
                message: "Failed to create post",
                details: err.message,
                code: err.code
              });
            }
          }
          
          console.log("Post created successfully, ID:", data.insertId);
          return res.status(200).json({
            message: "Post has been created!",
            postId: data.insertId
          });
        });
      });
    });
  } catch (error) {
    console.error("Unexpected error in addPost:", error);
    return res.status(500).json({
      error: "Server error",
      message: "An unexpected error occurred",
      details: error.message
    });
  }
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








