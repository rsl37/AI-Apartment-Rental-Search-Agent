import { Router } from 'express';
import apartmentsController from '../controllers/apartmentsController';

const router = Router();

// GET /api/apartments - Get all apartments with filtering
router.get('/', apartmentsController.getApartments.bind(apartmentsController));

// GET /api/apartments/export/csv - Export apartments to CSV
router.get('/export/csv', apartmentsController.exportCSV.bind(apartmentsController));

// GET /api/apartments/:id - Get single apartment
router.get('/:id', apartmentsController.getApartment.bind(apartmentsController));

// POST /api/apartments - Create new apartment
router.post('/', apartmentsController.createApartment.bind(apartmentsController));

// PUT /api/apartments/:id - Update apartment
router.put('/:id', apartmentsController.updateApartment.bind(apartmentsController));

// DELETE /api/apartments/:id - Delete apartment
router.delete('/:id', apartmentsController.deleteApartment.bind(apartmentsController));

export default router;