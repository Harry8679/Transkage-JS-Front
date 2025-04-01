import { Router } from 'express';
import { createCheckout, createStripePayment } from '../controllers/stripePayment.controller'; // Assurez-vous que le chemin est correct

const router = Router();

// Route pour créer un PaymentIntent Stripe
router.post('/create-payment-intent', createStripePayment);
router.post('/create-checkout-session', createCheckout);

export default router;