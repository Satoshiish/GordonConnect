import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const router = express.Router();

cloudinary.config(); // ✅ Automatically uses CLOUDINARY_URL from .env

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_uploads",
    });

    fs.unlinkSync(req.file.path); // delete local file

    res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

export default router;
