import { db } from "../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const register = (req, res) => {
  const q = "SELECT * FROM users WHERE username = ?";

  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length) return res.status(409).json("User already exist!");

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    const q =
      "INSERT INTO users (`username`, `email`, `password`,`name`) VALUE (?)";

    const values = [
      req.body.username,
      req.body.email,
      hashedPassword,
      req.body.name,
    ];

    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("User has been created.");
    });
  });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE username = ?";

  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("User not found!");

    const user = data[0];

    // Ensure password verification
    const checkPassword = bcrypt.compareSync(req.body.password, user.password);
    if (!checkPassword)
      return res.status(400).json("Wrong password or username!");

    // 🛠 Correcting ID reference
    const token = jwt.sign(
      { id: user.user_id }, // ✅ Use 'user_id' instead of 'id'
      "secretkey",
      { expiresIn: "1h" } // Optional: Set expiration time
    );

    const { password, ...others } = user;

    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .json({ ...others, token }); // Include token in response
  });
};

export const logout = (req, res) => {
  res
    .clearCookie("accessToken", {
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json("User has been logged out.");
};

export const verify = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json("Not authenticated!");
  }

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q = "SELECT * FROM users WHERE user_id = ?";
    db.query(q, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("User not found!");

      const { password, ...others } = data[0];
      return res.status(200).json(others);
    });
  });
};

export const requestPasswordReset = (req, res) => {
  const { email } = req.body;
  // Check if user exists
  const q = "SELECT * FROM users WHERE email = ?";
  db.query(q, [email], (err, data) => {
    if (err) return res.status(500).json({ error: "Database error." });
    if (data.length === 0) return res.status(404).json({ error: "User not found." });

    // Generate a simple reset link (for demo)
    const link = `https://gordon-connect.vercel.app/reset-password?email=${encodeURIComponent(email)}`;
    return res.json({ link });
  });
};

export const resetPassword = (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: "Missing username or password." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);
  const q = "UPDATE users SET password = ? WHERE username = ?";
  db.query(q, [hashedPassword, username], (err, data) => {
    if (err) return res.status(500).json({ error: "Database error." });
    if (data.affectedRows === 0) return res.status(404).json({ error: "User not found." });
    return res.json({ message: "Password has been reset successfully." });
  });
};

export const checkEmail = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const q = "SELECT * FROM users WHERE email = ?";
  db.query(q, [email], (err, data) => {
    if (err) return res.status(500).json({ error: "Database error." });
    return res.json({ exists: data.length > 0 });
  });
};



