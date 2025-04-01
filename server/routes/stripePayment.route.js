const express = require('express');
const { createCheckout, createStripePayment } = require('../controllers/stripePayment.controller');

const router = express.Router();

router.post('/create-payment-intent', createStripePayment);
router.post('/create-checkout-session', createCheckout);

module.exports = router;