const express = require('express');
const {
  acceptOrder,
  acceptOrderByTransporter,
  createOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  markOrderAsPaid,
  rejectOrder,
  rejectOrderByTransporter
} = require('../controllers/order.controller');

const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Créer une commande
router.post('/', protect, createOrder);

// Récupérer toutes les commandes
router.get('/', protect, getAllOrders);

// Récupérer les commandes de l'utilisateur connecté
router.get('/mine', protect, getUserOrders);

// Accepter une commande par ID (générique)
router.get('/accept-order/:id', protect, acceptOrder);

// Rejeter une commande par ID (générique)
router.get('/reject-order/:id', protect, rejectOrder);

// Accepter une commande par transporteur
router.put('/:orderId/accept', protect, acceptOrderByTransporter);

// Rejeter une commande par transporteur
router.put('/:orderId/reject', protect, rejectOrderByTransporter);

// Marquer une commande comme payée
router.put('/:orderId/mark-as-paid', protect, markOrderAsPaid);

// Récupérer une commande par ID
router.get('/:orderId', protect, getOrderById);

module.exports = router;
