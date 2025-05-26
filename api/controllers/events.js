import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const getEvents = async (req, res) => {
  try {
    // Simple query to get all events
    const q = `
      SELECT e.*, u.name as creator_name, u.profilePic as creator_pic,
             (SELECT COUNT(*) FROM event_avails WHERE event_id = e.id) as join_count
      FROM events e
      LEFT JOIN users u ON e.creator_id = u.user_id
      ORDER BY e.date ASC, e.time ASC
    `;
    
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json(data);
    });
  } catch (error) {
    console.error("Error in getEvents:", error);
    return res.status(500).json("Server error");
  }
};

export const addEvent = (req, res) => {
  // Use userInfo from middleware
  const userInfo = req.userInfo;
  
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
};

export const updateEvent = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
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
        // No email sending, just return success
        return res.status(200).json("Event has been updated!");
      });
    });
  });
};

export const deleteEvent = (req, res) => {
  // Check for token in cookies or Authorization header
  const cookieToken = req.cookies.accessToken;
  const headerToken = req.headers.authorization?.split(" ")[1];
  const token = cookieToken || headerToken;
  
  if (!token) {
    console.log("No token provided for event deletion");
    return res.status(401).json("Not authenticated!");
  }

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.status(403).json("Token is not valid!");
    }

    // Check if user is admin
    const checkAdminQ = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkAdminQ, [userInfo.id], (err, data) => {
      if (err) {
        console.log("Database error checking admin role:", err);
        return res.status(500).json(err);
      }
      
      if (!data || data.length === 0) {
        console.log("User not found:", userInfo.id);
        return res.status(404).json("User not found");
      }
      
      if (data[0].role !== "admin") {
        console.log("Non-admin tried to delete event. User role:", data[0].role);
        return res.status(403).json("Only admins can delete events!");
      }

      console.log("Admin verified, proceeding with event deletion");
      
      // First delete related records from event_avails
      const deleteAvailsQ = "DELETE FROM event_avails WHERE event_id = ?";
      db.query(deleteAvailsQ, [req.params.id], (err) => {
        if (err) {
          console.log("Error deleting event avails:", err);
          return res.status(500).json(err);
        }
        
        // Now delete the event
        const deleteEventQ = "DELETE FROM events WHERE id = ?";
        db.query(deleteEventQ, [req.params.id], (err, result) => {
          if (err) {
            console.log("Error deleting event:", err);
            return res.status(500).json(err);
          }
          
          if (result.affectedRows === 0) {
            console.log("Event not found:", req.params.id);
            return res.status(404).json("Event not found!");
          }
          
          console.log("Event deleted successfully:", req.params.id);
          return res.status(200).json("Event has been deleted!");
        });
      });
    });
  });
};

export const availEvent = (req, res) => {
  const eventId = req.params.id;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  // Check if already joined
  db.query(
    "SELECT id FROM event_avails WHERE event_id = ? AND email = ?",
    [eventId, email],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error", details: err });
      if (results.length > 0) {
        return res.status(409).json({ error: "This email has already joined this event." });
      }
      // Insert if not already joined
      db.query(
        "INSERT INTO event_avails (event_id, email) VALUES (?, ?)",
        [eventId, email],
        (err, result) => {
          if (err)
            return res
              .status(500)
              .json({ error: "Failed to save avail", details: err });
          return res.status(200).json({ message: "Avail saved" });
        }
      );
    }
  );
};

export const getEventJoins = (req, res) => {
  const eventId = req.params.id;
  db.query(
    "SELECT email FROM event_avails WHERE event_id = ?",
    [eventId],
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Failed to fetch joins", details: err });
      return res
        .status(200)
        .json({ count: results.length, emails: results.map((r) => r.email) });
    }
  );
};




