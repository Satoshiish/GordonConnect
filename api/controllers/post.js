import moment from "moment";
import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import util from 'util';

export const getPosts = (req, res) => {
  const userId = req.query.userId;
  const category = req.query.category;
  const postId = req.query.postId;
  
  let q = `
    SELECT p.*, u.user_id, u.username AS name, u.profile_pic AS profilePic, 
    p.visible
    FROM posts AS p 
    JOIN users AS u ON (u.user_id = p.user_id)
  `;
  
  const values = [];
  
  if (postId) {
    q += " WHERE p.posts_id = ?";
    values.push(postId);
  } else if (userId) {
    q += " WHERE p.user_id = ?";
    values.push(userId);
    if (category) {
      q += " AND p.category = ?";
      values.push(category);
    }
  } else if (category) {
    q += " WHERE p.category = ?";
    values.push(category);
  }
  
  q += " ORDER BY p.createdAt DESC";
  
  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const addPost = (req, res) => {
  const q =
    "INSERT INTO posts (`desc`, `img`, `createdAt`, `user_id`, `category`, `category2`, `category3`, `category4`) VALUES (?)";

  const values = [
    req.body.desc,
    req.body.img || null, 
    moment().format("YYYY-MM-DD HH:mm:ss"), 
    req.userInfo.id,
    req.body.category || 'student_life',
    req.body.category2 || null,
    req.body.category3 || null,
    req.body.category4 || null,
  ];

  db.query(q, [values], (err, data) => {
    if (err) {
      console.error("MySQL Error:", err);
      return res.status(500).json(err);
    }
    return res.status(200).json("Post has been created!");
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


