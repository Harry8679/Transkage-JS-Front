const Stripe = require('stripe');
const Order = require('../models/order.models');
const asyncHandler = require('express-async-handler');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

// Créer un PaymentIntent Stripe
const createStripePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    console.error('orderId manquant dans la requête');
    return res.status(400).json({ error: 'orderId manquant' });
  }

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      console.error(`Commande avec l'ID ${orderId} non trouvée`);
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (!order.kilos || !order.priceTranskage) {
      console.error('Les kilos ou le prix transkage ne sont pas définis pour cette commande');
      return res.status(400).json({ error: 'Les kilos ou le prix transkage sont manquants pour la commande' });
    }

    const totalAmount = Math.round(order.kilos * order.priceTranskage * 100); // en centimes

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
      payment_method_types: ['card'],
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({ error: 'Impossible de créer un paiement Stripe.' });
  }
});

// Créer une session Checkout Stripe
const createCheckout = asyncHandler(async (req, res) => {
  const { orderId, totalAmount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Commande ${orderId}`,
            },
            unit_amount: totalAmount, // en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URI}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URI}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur lors de la création de la session Stripe:', error);
    res.status(500).json({ error: 'Impossible de créer une session de paiement.' });
  }
});

module.exports = {
  createStripePayment,
  createCheckout,
};
