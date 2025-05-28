import express from 'express';
import { 
  getPosts, 
  addPost, 
  deletePost
} from '../controllers/post.js'; // Removed updatePostVisibility import
import { db } from '../connect.js';

const router = express.Router();

// Add a test endpoint to check database connection
router.get('/test-db', (req, res) => {
  console.log("Testing database connection...");
  
  db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      console.error("Database test failed:", err);
      return res.status(500).json({
        error: "Database connection test failed",
        message: err.message,
        code: err.code
      });
    }
    
    console.log("Database test successful:", results);
    return res.status(200).json({
      message: "Database connection is working",
      result: results[0].solution
    });
  });
});

router.get('/', getPosts);
router.post('/', addPost);
router.delete('/:id', deletePost);
// Removed the updatePostVisibility route

export default router;


