import express from 'express';
import { 
  getPosts, 
  addPost, 
  deletePost, 
  updatePostVisibility // Import the new function
} from '../controllers/post.js'; // Note: using post.js (singular)

const router = express.Router();

router.get('/', getPosts);
router.post('/', addPost);
router.delete('/:id', deletePost);

// Add this new route for updating post visibility
router.put('/:id/visibility', updatePostVisibility);

export default router;

