import moment from "moment";
import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getPosts = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const userId = req.query.userId; 
    const category = req.query.category;

    let q;
    let values;

    if (userId && category) {
      q = `
        SELECT p.*, u.user_id AS userId, u.name, u.profilePic 
        FROM posts AS p 
        JOIN users AS u ON (u.user_id = p.user_id) 
        WHERE p.user_id = ? AND p.category = ?
        ORDER BY p.createdAt DESC;
      `;
      values = [userId, category];
    } else if (userId) {
      q = `
        SELECT p.*, u.user_id AS userId, u.name, u.profilePic 
        FROM posts AS p 
        JOIN users AS u ON (u.user_id = p.user_id) 
        WHERE p.user_id = ? 
        ORDER BY p.createdAt DESC;
      `;
      values = [userId];
    } else if (category) {
      if (userInfo.role === 'guest') {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic, 'recommended' as post_type
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          WHERE p.category = ?
          ORDER BY p.createdAt DESC;
        `;
        values = [category];
      } else {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic,
          CASE 
            WHEN r.followerUser_id IS NOT NULL THEN 'following'
            ELSE 'recommended'
          END as post_type
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          LEFT JOIN relationships AS r ON (p.user_id = r.followedUser_id AND r.followerUser_id = ?)
          WHERE p.category = ?
          ORDER BY 
            CASE 
              WHEN r.followerUser_id IS NOT NULL THEN 0
              ELSE 1
            END,
            p.createdAt DESC;
        `;
        values = [userInfo.id, category];
      }
    } else {
      if (userInfo.role === 'guest') {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic, 'recommended' as post_type
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          ORDER BY p.createdAt DESC;
        `;
        values = [];
      } else {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic,
          CASE 
            WHEN r.followerUser_id IS NOT NULL THEN 'following'
            ELSE 'recommended'
          END as post_type
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          LEFT JOIN relationships AS r ON (p.user_id = r.followedUser_id AND r.followerUser_id = ?)
          ORDER BY 
            CASE 
              WHEN r.followerUser_id IS NOT NULL THEN 0
              ELSE 1
            END,
            p.createdAt DESC;
        `;
        values = [userInfo.id];
      }
    }

    db.query(q, values, (err, data) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json(err);
      }
      return res.status(200).json(data);
    });
  });
};

export const addPost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q =
      "INSERT INTO posts (`desc`, `img`, `createdAt`, `user_id`, `category`) VALUES (?)";

    const values = [
      req.body.desc,
      req.body.img || null, 
      moment().format("YYYY-MM-DD HH:mm:ss"), 
      userInfo.id,
      req.body.category || 'student_life',
    ];

    db.query(q, [values], (err, data) => {
      if (err) {
        console.error("MySQL Error:", err);
        return res.status(500).json(err);
      }
      return res.status(200).json("Post has been created!");
    });
  });
};

export const deletePost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = "DELETE FROM posts WHERE `posts_id` = ? AND `user_id` = ?";

    db.query(q, [req.params.id, userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.affectedRows > 0)
        return res.status(200).json("Post has been deleted!");
        return res.status(403).json("You can only delete your own post")
    });
  });
};
