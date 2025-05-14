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

    const q = `
      SELECT user_id, name, profilePic FROM users 
      WHERE user_id != ? AND user_id NOT IN (
        SELECT followedUser_id FROM relationships WHERE followerUser_id = ?
      ) LIMIT 5
    `;
    db.query(q, [userInfo.id, userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data);
    });
  });
};

// Friends
export const getFriends = (req, res) => {
  const token = req.cookies.accessToken;
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
