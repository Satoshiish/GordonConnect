// routes/events.js
import express from "express";
import { 
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventJoins,
  availEvent
} from "../controllers/events.js";
import { db } from "../connect.js";

const router = express.Router();

// Get all events
router.get("/", getEvents);

// Create new event (admin only)
router.post("/", addEvent);

// Update event (admin only)
router.put("/:id", updateEvent);

// Delete event (admin only)
router.delete("/:id", deleteEvent);

// Get who joined an event
router.get("/:id/joins", getEventJoins);

// Add this route for joining an event
router.post("/:id/avail", availEvent);

// Get all emails who joined a specific event
router.get('/:id/emails', (req, res) => {
  const eventId = req.params.id;
  db.query(
    "SELECT email FROM event_avails WHERE event_id = ?",
    [eventId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Failed to fetch emails" });
      res.json(results.map(e => e.email));
    }
  );
});

export default router;