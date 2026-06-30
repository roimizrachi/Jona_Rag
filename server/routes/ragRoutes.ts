import express from 'express';
import { loadData, askQuestion } from '../controllers/ragController';

const router = express.Router();

router.post('/load_data', loadData);
router.post('/ask', askQuestion);

export default router;
