import express from 'express';
import { createPath, getAllPaths } from '../controllers/path.controller';

const router = express.Router();

// Route pour créer un nouveau trajet
router.post('/paths', createPath);

// Route pour obtenir tous les trajets
router.get('/paths', getAllPaths);

export default router;