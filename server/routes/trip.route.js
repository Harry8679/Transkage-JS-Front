// trip.route.ts

import { Router } from 'express';
import { createTrip, getTripById, getTrips, getUserTrips, updateTrip } from '../controllers/trip.controller';
import { adminMiddleware, protect } from '../middlewares/auth.middleware';
// import { createTrip } from './trip.controller';

const router = Router();

// Route POST /api/v1/trips pour créer un trajet
router.post('/', protect, createTrip);

// Route GET /api/v1/trips pour récupérer tous les trajets
router.get('/', getTrips);

// Route GET /api/v1/trips/mine pour récupérer les trajets de l'utilisateur connecté
router.get('/mine', protect, getUserTrips);

// Route PUT /api/v1/trips/:id pour modifier un trajet
router.put('/:id', protect, adminMiddleware, updateTrip);

router.get('/:id', getTripById); // Route pour récupérer un trajet par son ID


export default router;