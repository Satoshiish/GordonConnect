// Add a new function to update post visibility
export const updatePostVisibility = (req, res) => {
  const { visible } = req.body;
  const postId = req.params.id;
  
  // Ensure the visible parameter is provided
  if (visible === undefined) {
    return res.status(400).json({ error: "Visibility parameter is required" });
  }
  
  // Update the post's visibility status
  const q = "UPDATE posts SET visible = ? WHERE posts_id = ?";
  
  db.query(q, [visible ? 1 : 0, postId], (err, result) => {
    if (err) {
      console.error("Error updating post visibility:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Post visibility updated to ${visible ? 'visible' : 'hidden'}`
    });
  });
};
