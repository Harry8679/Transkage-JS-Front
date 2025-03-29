const Trip = require('../models/trip.model');
const Purchase = require('../models/purchase.model');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');

// Acheter des kilos d'un trajet
const purchaseKilos = asyncHandler(async (req, res) => {
  const { tripId, kilos } = req.body;
  const trip = await Trip.findById(tripId);

  if (!trip) {
    res.status(404);
    throw new Error('Trajet non trouvé');
  }

  if (kilos > trip.availableKg) {
    res.status(400);
    throw new Error('Nombre de kilos non disponible.');
  }

  const totalPrice = trip.pricePerKilo * 1.15 * kilos; // marge de 15%
  const purchaseCode = uuidv4();

  const purchase = new Purchase({ user: req.user._id, trip: trip._id, kilosBought: kilos, totalPrice, purchaseCode });

  await purchase.save();

  trip.availableKg -= kilos;
  await trip.save();

  // TODO: Envoyer un email à l'utilisateur avec le code d'achat

  res.status(201).json({ purchaseCode, totalPrice });
});

// Vérifier le code d'achat
const verifyPurchaseCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const purchase = await Purchase.findOne({ purchaseCode: code });

  if (!purchase) {
    res.status(404);
    throw new Error('Code non trouvé.');
  }

  if (purchase.isCodeUsed) {
    res.status(400);
    throw new Error('Ce code a déjà été utilisé.');
  }

  purchase.isCodeUsed = true;
  await purchase.save();

  // TODO: Payer le transporteur

  res.status(200).json({ message: 'Code vérifié, le transporteur sera payé.' });
});

module.exports = { purchaseKilos, verifyPurchaseCode };