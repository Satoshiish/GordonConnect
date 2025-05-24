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
  const q = 'UPDATE reports SET reviewed = ? WHERE id = ?';
  db.query(q, [reviewed, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
}; 