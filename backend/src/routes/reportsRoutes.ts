import { Router } from 'express';
import reportsController from '../controllers/reportsController';

const router = Router();

// GET /api/reports - Get all reports
router.get('/', reportsController.getReports.bind(reportsController));

// GET /api/reports/latest - Get latest daily report
router.get('/latest', reportsController.getLatestDailyReport.bind(reportsController));

// GET /api/reports/stats - Get report statistics
router.get('/stats', reportsController.getReportStats.bind(reportsController));

// GET /api/reports/:id - Get single report
router.get('/:id', reportsController.getReport.bind(reportsController));

// POST /api/reports - Create report
router.post('/', reportsController.createReport.bind(reportsController));

// POST /api/reports/generate/daily - Generate daily report
router.post('/generate/daily', reportsController.generateDailyReport.bind(reportsController));

export default router;