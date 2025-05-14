// routes/events.js
import express from "express";
import { 
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/events.js";

const router = express.Router();

// Get all events
router.get("/", getEvents);

// Create new event (admin only)
router.post("/", addEvent);

// Update event (admin only)
router.put("/:id", updateEvent);

// Delete event (admin only)
router.delete("/:id", deleteEvent);



export default router;