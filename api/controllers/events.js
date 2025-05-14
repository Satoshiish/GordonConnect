import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const getEvents = (req, res) => {
  const q = "SELECT * FROM events ORDER BY date ASC";

  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    // Log the image field of each event for debugging
    if (Array.isArray(data)) {
      data.forEach(event => {
        console.log(`Event ID: ${event.id}, Image: ${event.image}`);
      });
    }
    return res.status(200).json(data);
  });
};

export const addEvent = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Check if user is admin
    const checkAdminQ = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkAdminQ, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data[0].role !== "admin")
        return res.status(403).json("Only admins can create events!");

      const q = `
        INSERT INTO events (title, date, time, location, description, image, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        req.body.title,
        req.body.date,
        req.body.time,
        req.body.location,
        req.body.description,
        req.body.image || null,
        userInfo.id,
      ];

      db.query(q, values, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(201).json("Event has been created!");
      });
    });
  });
};

export const updateEvent = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Check if user is admin
    const checkAdminQ = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkAdminQ, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data[0].role !== "admin")
        return res.status(403).json("Only admins can update events!");

      const q = `
        UPDATE events 
        SET title = ?, date = ?, time = ?, location = ?, description = ?, image = ?
        WHERE id = ? AND user_id = ?
      `;
      const values = [
        req.body.title,
        req.body.date,
        req.body.time,
        req.body.location,
        req.body.description,
        req.body.image || null,
        req.params.id,
        userInfo.id,
      ];

      db.query(q, values, (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.affectedRows === 0)
          return res.status(403).json("You can only update your own events!");
        // Notify availed users
        db.query(
          "SELECT email FROM event_avails WHERE event_id = ?",
          [req.params.id],
          async (err, results) => {
            if (!err && results.length > 0) {
              // Setup nodemailer (use your SMTP config)
              let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: process.env.NOTIFY_EMAIL_USER,
                  pass: process.env.NOTIFY_EMAIL_PASS,
                },
              });
              for (const row of results) {
                await transporter.sendMail({
                  from: process.env.NOTIFY_EMAIL_USER,
                  to: row.email,
                  subject: `Event Updated: ${req.body.title}`,
                  text: `The event you availed has been updated.\n\nTitle: ${req.body.title}\nDate: ${req.body.date}\nTime: ${req.body.time}\nLocation: ${req.body.location}\nDescription: ${req.body.description}`,
                });
              }
            }
            return res.status(200).json("Event has been updated and users notified!");
          }
        );
      });
    });
  });
};

export const deleteEvent = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Check if user is admin
    const checkAdminQ = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkAdminQ, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data[0].role !== "admin")
        return res.status(403).json("Only admins can delete events!");

      const q = "DELETE FROM events WHERE id = ? AND user_id = ?";

      db.query(q, [req.params.id, userInfo.id], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.affectedRows === 0)
          return res.status(403).json("You can only delete your own events!");
        return res.status(200).json("Event has been deleted!");
      });
    });
  });
};

export const availEvent = (req, res) => {
  const eventId = req.params.id;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  db.query(
    "INSERT INTO event_avails (event_id, email) VALUES (?, ?)",
    [eventId, email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to save avail", details: err });
      return res.status(200).json({ message: "Avail saved" });
    }
  );
};
