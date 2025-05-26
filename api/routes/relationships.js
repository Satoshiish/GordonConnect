import express from "express";
import { getRelationships, addRelationship, deleteRelationship } from "../controllers/relationship.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getRelationships);
router.post("/", verifyToken, addRelationship);
router.delete("/", verifyToken, deleteRelationship);

export default router;
