import moment from "moment";
import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import util from 'util';

export const getPosts = async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    const cookieToken = req.cookies.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;
    
    // Get query parameters
    const userId = req.query.userId; 
    const category = req.query.category;
    const anyCategory = req.query.anyCategory;
    const postId = req.query.postId;
    
    // Handle guest users or users with valid tokens
    let userInfo;
    
    if (!token || token.startsWith('guest_')) {
      // Guest user
      userInfo = { id: 'guest', role: 'guest' };
    } else {
      // Verify token for logged-in users
      try {
        userInfo = jwt.verify(token, "secretkey");
      } catch (err) {
        return res.status(403).json("Token is not valid!");
      }
    }

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

    // If a specific post ID is requested
    if (postId) {
      q = `
        SELECT p.*, u.user_id AS userId, u.name, u.profilePic
        FROM posts AS p 
        JOIN users AS u ON (u.user_id = p.user_id)
        WHERE p.posts_id = ?
      `;
      values = [postId];
    } 
    // If a specific user's posts are requested
    else if (userId) {
      q = `
        SELECT p.*, u.user_id AS userId, u.name, u.profilePic
        FROM posts AS p 
        JOIN users AS u ON (u.user_id = p.user_id)
        WHERE p.user_id = ?
        ${category ? "AND p.category = ?" : ""}
        ORDER BY p.createdAt DESC
      `;
      values = category ? [userId, category] : [userId];
    } 
    // All posts (with optional category filter)
    else {
      if (userInfo.role === 'guest') {
        q = `
          SELECT p.*, u.user_id AS userId, u.name, u.profilePic, 'recommended' as post_type
          FROM posts AS p 
          JOIN users AS u ON (u.user_id = p.user_id)
          ${anyCategory ? "WHERE p.category = ?" : ""}
          ORDER BY p.createdAt DESC;
        `;
        values = anyCategory ? [anyCategory] : [];
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
    }

    // Execute the query
    const [rows] = await db.query(q, values);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error in getPosts:", error);
    return res.status(500).json("Server error");
  }
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








