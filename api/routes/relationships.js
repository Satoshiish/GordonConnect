import express from "express";
import { getRelationships, addRelationships, deleteRelationships } from "../controllers/relationship.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getRelationships);
router.post("/", verifyToken, addRelationships);
router.delete("/", verifyToken, deleteRelationships);

export default router
