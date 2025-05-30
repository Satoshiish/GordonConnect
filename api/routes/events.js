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
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Test endpoint that just returns a simple response
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Events API is working" });
});

// Get all events - public access
router.get("/", getEvents);

// Create new event (admin only)
router.post("/", verifyToken, addEvent);

// Update event (admin only)
router.put("/:id", verifyToken, updateEvent);

// Delete event (admin only)
router.delete("/:id", verifyToken, deleteEvent);

// Get who joined an event
router.get("/:id/joins", getEventJoins);

// Add this route for joining an event
router.post("/:id/avail", availEvent);

// Get all emails who joined a specific event with user details
router.get('/:id/emails', verifyToken, (req, res) => {
  const eventId = req.params.id;
  
  // Debug log
  console.log(`Fetching joined users for event ID: ${eventId}`);
  
  db.query(
    `SELECT ea.email, ea.invitedBy, u.username, u.name, u.profilePic 
     FROM event_avails ea 
     LEFT JOIN users u ON LOWER(ea.email) = LOWER(u.email) 
     WHERE ea.event_id = ?`,
    [eventId],
    (err, results) => {
      if (err) {
        console.error("Error fetching joined users:", err);
        return res.status(500).json({ message: "Failed to fetch emails" });
      }
      
      console.log(`Found ${results.length} joined users:`, results);
      
      // Map results to include isRegistered flag
      const enhancedResults = results.map(user => ({
        ...user,
        isRegistered: user.username !== null
      }));
      
      res.json(enhancedResults);
    }
  );
});

export default router;


