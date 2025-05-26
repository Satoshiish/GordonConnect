import { db } from "../connect.js";
import jwt from "jsonwebtoken";

// Get user by user_id (not username)
export const getUser = (req, res) => {
  const userId = req.params.userId;

  const q = `
    SELECT user_id, username, email, name, coverPic, profilePic, role 
    FROM users 
    WHERE user_id = ?
  `;

  db.query(q, [userId], (err, data) => {
    if (err) return res.status(500).json(err);

    if (!data || data.length === 0) {
      return res.status(404).json("User not found");
    }

    // No password in this query, so no need to destructure it
    return res.json(data[0]);
  });
};

export const updateUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not Authenticated");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid");

    const q = `
      UPDATE users 
      SET name = ?, city = ?, website = ?, profilePic = ?, coverPic = ? 
      WHERE user_id = ?
    `;

    db.query(
      q,
      [
        req.body.name,
        req.body.city,
        req.body.website,
        req.body.profilePic,
        req.body.coverPic,
        userInfo.id,
      ],
      (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.affectedRows > 0) return res.json("Updated!");
        return res.status(403).json("You can only update your profile!");
      }
    );
  });
};

export const getSuggestions = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    // First, get user's interests and activity data
    const getUserInterestsQuery = `
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

    db.query(getUserInterestsQuery, [userInfo.id, userInfo.id], (err, interestData) => {
      if (err) return res.status(500).json(err);
      
      const primaryInterest = interestData[0]?.primary_interest || 'general';
      const secondaryInterest = interestData[0]?.secondary_interest || 'general';
      
      // Get user's location/city if available
      const getUserLocationQuery = `SELECT city FROM users WHERE user_id = ?`;
      
      db.query(getUserLocationQuery, [userInfo.id], (err, locationData) => {
        if (err) return res.status(500).json(err);
        
        const userCity = locationData[0]?.city || '';
        
        // Complex query to get suggestions based on:
        // 1. Users with similar interests (from posts and likes)
        // 2. Users from the same location/city if available
        // 3. Users with high engagement (many posts or followers)
        // 4. Excluding users already followed
        const suggestionsQuery = `
          SELECT u.user_id, u.name, u.username, u.profilePic, u.city,
            CASE
              WHEN u.city = ? THEN 20
              ELSE 0
            END +
            CASE
              WHEN EXISTS (
                SELECT 1 FROM posts WHERE user_id = u.user_id AND category IN (?, ?)
              ) THEN 15
              ELSE 0
            END +
            CASE
              WHEN (SELECT COUNT(*) FROM posts WHERE user_id = u.user_id) > 5 THEN 10
              ELSE 0
            END +
            CASE
              WHEN (SELECT COUNT(*) FROM relationships WHERE followedUser_id = u.user_id) > 3 THEN 5
              ELSE 0
            END AS relevance_score
          FROM users u
          WHERE u.user_id != ? 
            AND u.user_id NOT IN (
              SELECT followedUser_id FROM relationships WHERE followerUser_id = ?
            )
          ORDER BY relevance_score DESC, RAND()
          LIMIT 8
        `;
        
        db.query(suggestionsQuery, [userCity, primaryInterest, secondaryInterest, userInfo.id, userInfo.id], (err, data) => {
          if (err) return res.status(500).json(err);
          
          // Add relevance reason to each suggestion
          const enhancedSuggestions = data.map(user => {
            let reason = "";
            
            if (user.city && user.city === userCity) {
              reason = "From your city";
            } else {
              // Check if they have posts in user's interests
              const checkInterestsQuery = `
                SELECT category FROM posts 
                WHERE user_id = ? AND category IN (?, ?)
                LIMIT 1
              `;
              
              db.query(checkInterestsQuery, [user.user_id, primaryInterest, secondaryInterest], (err, interestMatch) => {
                if (!err && interestMatch.length > 0) {
                  reason = `Interested in ${interestMatch[0].category}`;
                }
              });
              
              // If no reason set yet, use a generic one
              if (!reason) {
                reason = "Popular in the community";
              }
            }
            
            return {
              ...user,
              reason
            };
          });
          
          return res.status(200).json(enhancedSuggestions);
        });
      });
    });
  });
};

// Friends
export const getFriends = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    // Modified query that doesn't use created_at
    const q = `
      SELECT u.user_id AS id, u.name, u.profilePic
      FROM users u
      INNER JOIN relationships r ON u.user_id = r.followedUser_id
      WHERE r.followerUser_id = ?
    `;

    db.query(q, [userInfo.id], (err, data) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          error: "Database error",
          details: err.message,
        });
      }

      // Add current date as since if you still want to show something
      const friendsWithSince = data.map((friend) => ({
        ...friend,
        since: new Date().toISOString().split("T")[0], // Today's date as fallback
      }));

      return res.status(200).json(friendsWithSince);
    });
  });
};

// Get followers list with user details
export const getFollowers = (req, res) => {
  const userId = req.params.userId;
  
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    const q = `
      SELECT u.user_id as id, u.name, u.profilePic, u.city
      FROM users u
      INNER JOIN relationships r ON u.user_id = r.followerUser_id
      WHERE r.followedUser_id = ?
    `;

    db.query(q, [userId], (err, data) => {
      if (err) return res.status(500).json({ error: "Database error", details: err });
      return res.status(200).json(data);
    });
  });
};

// Get following list with user details
export const getFollowing = (req, res) => {
  const userId = req.params.userId;
  
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) return res.status(401).json({ error: "Not logged in!" });

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json({ error: "Token is not valid!" });

    const q = `
      SELECT u.user_id as id, u.name, u.profilePic, u.city
      FROM users u
      INNER JOIN relationships r ON u.user_id = r.followedUser_id
      WHERE r.followerUser_id = ?
    `;

    db.query(q, [userId], (err, data) => {
      if (err) return res.status(500).json({ error: "Database error", details: err });
      return res.status(200).json(data);
    });
  });
};
