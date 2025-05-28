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

  // First update the report status
  const q = 'UPDATE reports SET reviewed = ? WHERE id = ?';
  db.query(q, [reviewed, id], (err, result) => {
    if (err) {
      console.error('Error updating report:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // If we're not handling a post visibility update or if no post_id was provided, just return success
    if (reviewed !== 1 || !post_id) {
      return res.json({ success: true });
    }
    
    // If report is approved (reviewed = 1), ensure the post remains visible
    const postQuery = 'UPDATE posts SET visible = 1 WHERE posts_id = ?';
    db.query(postQuery, [post_id], (postErr, postResult) => {
      if (postErr) {
        console.error('Error updating post visibility:', postErr);
        // We still mark the report update as successful even if post update fails
        return res.json({ 
          success: true, 
          warning: "Report status updated but post visibility update failed" 
        });
      }
      
      return res.json({ 
        success: true, 
        message: "Report and post status updated successfully" 
      });
    });
  });
}; 
