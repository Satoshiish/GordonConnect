import express from 'express';
import { 
  getPosts, 
  addPost, 
  deletePost, 
  updatePost,
  updatePostVisibility // Import the new function
} from '../controllers/post.js'; // Note: using post.js (singular)

const router = express.Router();

router.get('/', getPosts);
router.post('/', addPost);
router.delete('/:id', deletePost);
router.put('/:id', updatePost);

// Add this new route for updating post visibility
router.put('/:id/visibility', updatePostVisibility);

export default router;



