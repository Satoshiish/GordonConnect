import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getEvents = (req, res) => {
  // Simple query to get all events
  const q = `
    SELECT e.*, 
           (SELECT COUNT(*) FROM event_avails WHERE event_id = e.id) as join_count
    FROM events e
    ORDER BY e.date ASC
  `;

  db.query(q, (err, data) => {
    if (err) {
      console.error("Database error in getEvents:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    
    // Log the image field of each event for debugging
    if (Array.isArray(data)) {
      data.forEach((event) => {
        console.log(`Event ID: ${event.id}, Image: ${event.image}`);
      });
    }
    
    return res.status(200).json(data || []);
  });
};

export const addEvent = (req, res) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Check if user is admin
    const checkAdminQ = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkAdminQ, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data[0].role !== "admin")
        return res.status(403).json("Only admins can create events!");

      // Log the incoming request body for debugging
      console.log("Creating event with data:", req.body);
      
      // Prepare image URL - if it's just a filename, add the /upload/ prefix
      let imageUrl = req.body.image;
      if (imageUrl && !imageUrl.startsWith("/upload/") && !imageUrl.startsWith("http")) {
        imageUrl = "/upload/" + imageUrl;
      }
      
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
        imageUrl,
        userInfo.id,
      ];

      db.query(q, values, (err, data) => {
        if (err) {
          console.error("Database error creating event:", err);
          return res.status(500).json(err);
        }
        return res.status(201).json("Event has been created!");
      });
    });
  });
};

export const updateEvent = (req, res) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Check if user is admin
    const checkAdminQ = "SELECT role FROM users WHERE user_id = ?";
    db.query(checkAdminQ, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data[0].role !== "admin")
        return res.status(403).json("Only admins can update events!");

      // Prepare image URL - if it's just a filename, add the /upload/ prefix
      let imageUrl = req.body.image;
      if (imageUrl && !imageUrl.startsWith("/upload/") && !imageUrl.startsWith("http")) {
        imageUrl = "/upload/" + imageUrl;
      }
      
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
        imageUrl,
        req.params.id,
        userInfo.id,
      ];

      db.query(q, values, (err, data) => {
        if (err) {
          console.error("Database error updating event:", err);
          return res.status(500).json(err);
        }
        if (data.affectedRows === 0)
          return res.status(403).json("You can only update your own events!");
        return res.status(200).json("Event has been updated!");
      });
    });
  });
};

export const deleteEvent = (req, res) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
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



