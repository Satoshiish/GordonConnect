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
    
    console.log("GET Posts - Token from cookie:", cookieToken ? "Present" : "Not present");
    console.log("GET Posts - Token from header:", headerToken ? "Present" : "Not present");
    
    if (!token) {
      console.log("GET Posts - No authentication token found");
      // Instead of returning 401, let's return empty posts for unauthenticated users
      return res.status(200).json([]);
    }

    jwt.verify(token, "secretkey", async (err, userInfo) => {
      if (err) {
        console.error("GET Posts - Token verification failed:", err.message);
        // Instead of returning 403, let's return empty posts for invalid tokens
        return res.status(200).json([]);
      }

      const userId = req.query.userId; 
      const category = req.query.category;
      const anyCategory = req.query.anyCategory;

      // Get user's interests and activity data (similar to getSuggestions algorithm)
      let userInterests = [];
      let userCity = '';
      
      try {
        const query = util.promisify(db.query).bind(db);
        
        // Get user's primary and secondary interests
        const interestsQuery = `
          SELECT 
            COALESCE(
              (SELECT category FROM posts WHERE user_id = ? ORDER BY createdAt DESC LIMIT 1),
              'general'
            ) as primary_interest,
            (
              SELECT p.category 
              FROM likes l 
              JOIN posts p ON l.posts_id = p.posts_id 
              WHERE l.user_id = ? 
              GROUP BY p.category 
              ORDER BY COUNT(*) DESC 
              LIMIT 1
            ) as secondary_interest
        `;
        
        const interestData = await query(interestsQuery, [userInfo.id, userInfo.id]);
        const primaryInterest = interestData[0]?.primary_interest || 'general';
        const secondaryInterest = interestData[0]?.secondary_interest || 'general';
        userInterests = [primaryInterest, secondaryInterest];
        
        // Get user's location/city
        const locationQuery = `SELECT city FROM users WHERE user_id = ?`;
        const locationData = await query(locationQuery, [userInfo.id]);
        userCity = locationData[0]?.city || '';
      } catch (e) {
        console.error("Error getting user interests:", e);
        userInterests = ['general'];
      }

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
      } else if (anyCategory) {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic,
          CASE 
            WHEN r.followerUser_id IS NOT NULL THEN 'following'
            WHEN p.category IN (?) OR p.category2 IN (?) OR p.category3 IN (?) OR p.category4 IN (?) THEN 'recommended'
            ELSE 'other'
          END as post_type
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          LEFT JOIN relationships AS r ON (p.user_id = r.followedUser_id AND r.followerUser_id = ?)
          WHERE p.category = ? OR p.category2 = ? OR p.category3 = ? OR p.category4 = ?
          ORDER BY 
            CASE 
              WHEN r.followerUser_id IS NOT NULL THEN 0
              WHEN p.category IN (?) OR p.category2 IN (?) OR p.category3 IN (?) OR p.category4 IN (?) THEN 1
              ELSE 2
            END,
            p.createdAt DESC;
        `;
        values = [anyCategory, anyCategory, anyCategory, anyCategory, userInfo.id, anyCategory, anyCategory, anyCategory, anyCategory, anyCategory, anyCategory, anyCategory, anyCategory];
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
          // Enhanced algorithm for category posts
          q = `
            SELECT p.*, u.user_id AS userId, u.name, u.profilePic, u.city,
            CASE 
              WHEN r.followerUser_id IS NOT NULL THEN 'following'
              ELSE 'recommended'
            END as post_type,
            CASE
              WHEN r.followerUser_id IS NOT NULL THEN 0
              WHEN u.city = ? AND u.city != '' THEN 1
              WHEN p.category IN (?) THEN 2
              ELSE 3
            END as relevance_score
            FROM posts AS p 
            JOIN users AS u ON (u.user_id = p.user_id)
            LEFT JOIN relationships AS r ON (p.user_id = r.followedUser_id AND r.followerUser_id = ?)
            WHERE p.category = ?
            ORDER BY relevance_score, p.createdAt DESC;
          `;
          values = [userCity, userInterests, userInfo.id, category];
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
          // Enhanced algorithm for all posts
          q = `
            SELECT p.*, u.user_id AS userId, u.name, u.profilePic, u.city,
            CASE 
              WHEN r.followerUser_id IS NOT NULL THEN 'following'
              ELSE 'recommended'
            END as post_type,
            CASE
              WHEN r.followerUser_id IS NOT NULL THEN 0
              WHEN u.city = ? AND u.city != '' THEN 1
              WHEN p.category IN (?) THEN 2
              ELSE 3
            END as relevance_score
            FROM posts AS p 
            JOIN users AS u ON (u.user_id = p.user_id)
            LEFT JOIN relationships AS r ON (p.user_id = r.followedUser_id AND r.followerUser_id = ?)
            ORDER BY relevance_score, p.createdAt DESC;
          `;
          values = [userCity, userInterests, userInfo.id];
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
  } catch (error) {
    console.error("Unexpected error in getPosts:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
};

export const addPost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q =
      "INSERT INTO posts (`desc`, `img`, `createdAt`, `user_id`, `category`, `category2`, `category3`, `category4`) VALUES (?)";

    const values = [
      req.body.desc,
      req.body.img || null, 
      moment().format("YYYY-MM-DD HH:mm:ss"), 
      userInfo.id,
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

