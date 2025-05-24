import express from 'express';
import { getReports, createReport, updateReport } from '../controllers/reports.js';

const router = express.Router();

// GET all reports
router.get('/', getReports);

// POST a new report
router.post('/', createReport);

// PUT to update a report's reviewed status
router.put('/:id', updateReport);

export default router; 