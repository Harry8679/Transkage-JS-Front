const express = require('express');
const {
  createTrip,
  getTripById,
  getTrips,
  getUserTrips,
  updateTrip
} = require('../controllers/trip.controller');

const {
  protect,
  adminMiddleware
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', protect, createTrip);
router.get('/', getTrips);
router.get('/mine', protect, getUserTrips);
router.put('/:id', protect, adminMiddleware, updateTrip);
router.get('/:id', getTripById);

module.exports = router;