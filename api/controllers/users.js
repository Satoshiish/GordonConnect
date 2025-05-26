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
  try {
    // Use userInfo from middleware
    const userInfo = req.userInfo;
    
    console.log("Getting suggestions for user:", userInfo.id);
    
    // If user is a guest, return a limited set of suggestions
    if (userInfo.role === 'guest' || userInfo.id === 'guest') {
      console.log("Providing guest suggestions");
      
      // For guests, just return some random users
      const guestSuggestionsQuery = `
        SELECT 
          u.user_id, 
          u.username, 
          u.name, 
          u.profilePic, 
          u.city
        FROM users u
        WHERE u.role != 'guest'
        ORDER BY RAND()
        LIMIT 10
      `;
      
      db.query(guestSuggestionsQuery, (err, data) => {
        if (err) {
          console.error("Error fetching guest suggestions:", err);
          return res.status(500).json(err);
        }
        
        console.log("Found guest suggestions:", data.length);
        
        // Map the data to include the id property
        const enhancedSuggestions = data.map(user => ({
          ...user,
          id: user.user_id,
          isFollowing: false,
          reason: "Popular in the community"
        }));
        
        return res.status(200).json(enhancedSuggestions);
      });
      
      return;
    }
    
    // For logged-in users, use the original query
    const suggestionsQuery = `
      SELECT 
        u.user_id, 
        u.username, 
        u.name, 
        u.profilePic, 
        u.city
      FROM users u
      LEFT JOIN relationships r ON u.user_id = r.followedUser_id AND r.followerUser_id = ?
      WHERE u.user_id != ? 
        AND u.role != 'guest'
        AND r.followerUser_id IS NULL
      ORDER BY RAND()
      LIMIT 15
    `;
    
    db.query(suggestionsQuery, [userInfo.id, userInfo.id], (err, data) => {
      if (err) {
        console.error("Error fetching suggestions:", err);
        return res.status(500).json(err);
      }
      
      console.log("Found suggestions:", data.length);
      
      // Map the data to include the id property
      const enhancedSuggestions = data.map(user => ({
        ...user,
        id: user.user_id,
        isFollowing: false, // All suggestions are not being followed
        reason: user.city ? "From your city" : "Popular in the community"
      }));
      
      return res.status(200).json(enhancedSuggestions);
    });
  } catch (error) {
    console.error("Unexpected error in getSuggestions:", error);
    return res.status(500).json("Internal server error");
  }
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
