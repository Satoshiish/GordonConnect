import { db } from '../connect.js';

export const getReports = (req, res) => {
  const q = 'SELECT * FROM reports ORDER BY created_at DESC';
  db.query(q, (err, data) => {
    if (err) {
      console.error('Error fetching reports:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(data);
  });
};

export const createReport = (req, res) => {
  let { user_id, post_id, reason } = req.body;
  if (!user_id) user_id = null; // Allow guest reports
  if (!post_id || !reason) {
    return res.status(400).json({ error: 'post_id and reason are required.' });
  }
  console.log('Received report:', { user_id, post_id, reason });
  const q = 'INSERT INTO reports (user_id, post_id, reason, created_at, reviewed) VALUES (?, ?, ?, NOW(), 0)';
  db.query(q, [user_id, post_id, reason], (err, result) => {
    if (err) {
      console.error('Error creating report:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: result.insertId, user_id, post_id, reason, created_at: new Date(), reviewed: 0 });
  });
};

export const updateReport = (req, res) => {
  const { reviewed } = req.body;
  const { id } = req.params;
  const post_id = req.body.post_id;

  console.log(`Updating report ${id} with reviewed=${reviewed} for post_id=${post_id}`);

  // First update the report status
  const q = 'UPDATE reports SET reviewed = ? WHERE id = ?';
  db.query(q, [reviewed, id], (err, result) => {
    if (err) {
      console.error('Error updating report:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // If no post_id was provided, just return success
    if (!post_id) {
      console.log('No post_id provided, skipping post visibility update');
      return res.json({ success: true });
    }
    
    // Set post visibility based on review decision:
    // When report is approved (reviewed = 1), the post should be hidden (visible = 0)
    // When report is rejected (reviewed = 2), the post should remain visible (visible = 1)
    const visible = reviewed === 1 ? 0 : 1;
    
    console.log(`Setting post ${post_id} visibility to ${visible}`);
    
    const postQuery = 'UPDATE posts SET visible = ? WHERE posts_id = ?';
    db.query(postQuery, [visible, post_id], (postErr, postResult) => {
      if (postErr) {
        console.error('Error updating post visibility:', postErr);
        // We still mark the report update as successful even if post update fails
        return res.json({ 
          success: true, 
          warning: "Report status updated but post visibility update failed" 
        });
      }
      
      console.log(`Post visibility updated. Affected rows: ${postResult.affectedRows}`);
      
      return res.json({ 
        success: true, 
        message: `Report updated and post is now ${visible ? 'visible' : 'hidden'}`
      });
    });
  });
}; 
