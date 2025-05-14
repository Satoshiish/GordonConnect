import express from "express";
import { login, register, logout, verify, resetPassword } from "../controllers/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/verify", verify);
router.post("/reset-password", resetPassword);

export default router;
