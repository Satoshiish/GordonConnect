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
  // Use userInfo from middleware
  const userInfo = req.userInfo;
  
  console.log("Getting suggestions for user:", userInfo.id);
  
  // Get current user's info for better suggestions
  const q = "SELECT city, interests FROM users WHERE user_id = ?";
  
  db.query(q, [userInfo.id], (err, userData) => {
    if (err) {
      console.error("Error fetching user data:", err);
      return res.status(500).json(err);
    }
    
    if (!userData || userData.length === 0) {
      console.log("User not found:", userInfo.id);
      return res.status(404).json("User not found");
    }
    
    const userCity = userData[0].city || "";
    let userInterests = [];
    
    try {
      // Safely parse interests, handling null or invalid JSON
      if (userData[0].interests) {
        userInterests = typeof userData[0].interests === 'string' 
          ? JSON.parse(userData[0].interests) 
          : userData[0].interests;
      }
    } catch (e) {
      console.error("Error parsing interests:", e);
      userInterests = [];
    }
    
    // Extract primary and secondary interests if available
    const primaryInterest = userInterests[0] || "";
    const secondaryInterest = userInterests[1] || "";
    
    console.log("User city:", userCity);
    console.log("User interests:", primaryInterest, secondaryInterest);
    
    // Find users not followed by current user
    const suggestionsQuery = `
      SELECT u.user_id, u.username, u.name, u.profilePic, u.city,
             CASE WHEN r.followerUser_id IS NOT NULL THEN 1 ELSE 0 END AS isFollowing
      FROM users u
      LEFT JOIN relationships r ON u.user_id = r.followedUser_id AND r.followerUser_id = ?
      WHERE u.user_id != ? AND u.role != 'guest'
      ORDER BY RAND()
      LIMIT 20
    `;
    
    db.query(suggestionsQuery, [userInfo.id, userInfo.id], (err, data) => {
      if (err) {
        console.error("Error fetching suggestions:", err);
        return res.status(500).json(err);
      }
      
      console.log("Found suggestions:", data.length);
      
      // Add a reason to each suggestion without async operations
      const enhancedSuggestions = data.map(user => {
        let reason = "";
        
        if (user.city && user.city === userCity) {
          reason = "From your city";
        } else {
          reason = "Popular in the community";
        }
        
        return {
          ...user,
          reason
        };
      });
      
      return res.status(200).json(enhancedSuggestions);
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
