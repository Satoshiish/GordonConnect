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

// Get all emails who joined a specific event with user details if available
router.get('/:id/emails', verifyToken, (req, res) => {
  const eventId = req.params.id;
  
  try {
    // Modified query to join with users table to get user details when available
    const q = `
      SELECT ea.email, ea.invitedBy, 
             u.user_id, u.username, u.name, u.profilePic 
      FROM event_avails ea
      LEFT JOIN users u ON ea.email = u.email
      WHERE ea.event_id = ?
    `;
    
    db.query(q, [eventId], (err, results) => {
      if (err) {
        console.error("Database error fetching joined users:", err);
        return res.status(500).json({ message: "Failed to fetch emails", error: err.message });
      }
      
      // Format the response
      const formattedResults = results.map(row => ({
        email: row.email,
        invitedBy: row.invitedBy || 'System',
        user_id: row.user_id || null,
        username: row.username || null,
        name: row.name || null,
        profilePic: row.profilePic || null,
        isRegistered: !!row.user_id // Flag to indicate if this email belongs to a registered user
      }));
      
      return res.json(formattedResults);
    });
  } catch (error) {
    console.error("Error in /:id/emails route:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;


