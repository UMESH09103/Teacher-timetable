import express from 'express';
import {
  getSubstitutions,
  getSubstituteCandidates,
  assignSubstitute,
  updateSubstitutionStatus,
  cancelSubstitution
} from '../controllers/substitutionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getSubstitutions);
router.get('/candidates', protect, getSubstituteCandidates);
router.post('/assign', protect, authorize('principal'), assignSubstitute);
router.put('/:id/status', protect, updateSubstitutionStatus);
router.delete('/:id', protect, authorize('principal'), cancelSubstitution);

export default router;
