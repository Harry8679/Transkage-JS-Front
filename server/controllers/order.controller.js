const asyncHandler = require('express-async-handler');
const Order = require('../models/order.model');
const Trip = require('../models/trip.model');
const sendMailOrder = require('../utils/sendEmailOrder');

// Générer un code secret aléatoire
const generateSecretCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Créer une commande
const createOrder = asyncHandler(async (req, res) => {
  const { kilos, productDescription, productDimensions, tripId } = req.body;
  const sender = req.user;

  if (!sender) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ message: 'Trajet non trouvé.' });
  }

  if (kilos > trip.kilos) {
    return res.status(400).json({ message: `Nombre de kilos demandé dépasse les ${trip.kilos} kilos disponibles.` });
  }

  if (kilos <= 0) {
    return res.status(400).json({ message: `Nombre de kilos demandé ne peut pas être inférieur ou égal à 0.` });
  }

  const { pricePerKilo, priceTranskage } = trip;

  if (!pricePerKilo || !priceTranskage) {
    return res.status(400).json({ message: "Le prix per kilo ou le prix transkage n'est pas défini pour ce trajet." });
  }

  const totalPriceTransporter = kilos * pricePerKilo;
  const totalPriceTranskage = kilos * priceTranskage;

  const newOrder = new Order({
    kilos,
    productDescription,
    productDimensions,
    secretCode: generateSecretCode(),
    pricePerKilo,
    priceTranskage,
    totalPriceTransporter,
    totalPriceTranskage,
    sender: sender._id,
    transporter: trip.author._id,
    trip: trip._id,
  });

  await newOrder.save();

  res.status(201).json({ message: 'Commande créée avec succès.', order: newOrder });
});

// Accepter une commande
const acceptOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: 'Commande non trouvée.' });

  order.trackingStatus = 'remis au transporteur';
  await order.save();

  res.status(200).json({ message: 'Commande acceptée avec succès.', order });
});

// Refuser une commande
const rejectOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: 'Commande non trouvée.' });

  order.trackingStatus = 'refusé';
  await order.save();

  res.status(200).json({ message: 'Commande refusée avec succès.', order });
});

// Marquer une commande comme payée
const markOrderAsPaid = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate('sender', 'firstName lastName email')
    .populate('transporter', 'firstName lastName email')
    .populate('trip');

  if (!order) return res.status(404).json({ message: 'Commande non trouvée' });

  order.isPaid = true;
  await order.save();

  const senderLink = `${process.env.FRONTEND_URL}/order/${order._id}`;
  const transporterLink = `${process.env.FRONTEND_URL}/accept-order/${order._id}`;

  await sendMailOrder(
    'Commande payée',
    order.sender.email,
    process.env.EMAIL_USER,
    process.env.EMAIL_USER,
    'orderPaidSender',
    {
      firstName: order.sender.firstName,
      lastName: order.sender.lastName,
      secretCode: order.secretCode,
      productDescription: order.productDescription,
      kilos: order.kilos,
      productDimensions: order.productDimensions,
      link: senderLink,
    }
  );

  await sendMailOrder(
    'Nouvelle commande à accepter',
    order.transporter.email,
    process.env.EMAIL_USER,
    process.env.EMAIL_USER,
    'orderPaidTransporter',
    {
      firstName: order.transporter.firstName,
      lastName: order.transporter.lastName,
      kilos: order.kilos,
      productDescription: order.productDescription,
      productDimensions: order.productDimensions,
      acceptUrl: transporterLink,
      rejectUrl: `${process.env.FRONTEND_URL}/reject-order/${order._id}`,
    }
  );

  res.status(200).json({
    message: 'Commande marquée comme payée et emails envoyés avec succès',
    order,
  });
});

// Obtenir toutes les commandes
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('sender transporter trip');

  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: 'Aucune commande trouvée.' });
  }

  res.status(200).json({
    message: 'Liste des commandes récupérée avec succès.',
    number_orders: orders.length,
    orders,
  });
});

// Obtenir une commande par ID
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId).populate('sender transporter trip');
  if (!order) return res.status(404).json({ message: 'Commande non trouvée.' });

  res.status(200).json({ message: 'Commande récupérée avec succès.', order });
});

// Accepter une commande par le transporteur
const acceptOrderByTransporter = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId).populate('trip');

  if (!order) return res.status(404).json({ message: 'Commande non trouvée.' });

  if (
    order.trackingStatus === 'commande validée par le transporteur' ||
    order.trackingStatus === 'refusé'
  ) {
    return res.status(400).json({ message: 'Commande déjà traitée.' });
  }

  const trip = order.trip;
  if (!trip) return res.status(404).json({ message: 'Trajet non trouvé pour cette commande.' });

  if (trip.kilos < order.kilos) {
    return res.status(400).json({ message: 'Pas assez de kilos disponibles dans ce trajet.' });
  }

  trip.kilos -= order.kilos;
  await trip.save();

  order.trackingStatus = 'commande validée par le transporteur';
  order.validateByTransporter = true;
  await order.save();

  res.status(200).json({ message: 'Commande validée par le transporteur.', order });
});

// Refuser une commande par le transporteur
const rejectOrderByTransporter = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Commande non trouvée.' });

  order.trackingStatus = 'refusé';
  order.validateByTransporter = false;
  await order.save();

  res.status(200).json({ message: 'Commande refusée avec succès.', order });
});

// Récupérer les commandes d'un utilisateur connecté
const getUserOrders = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  const orders = await Order.find({ sender: user._id })
    .populate('trip')
    .populate('transporter', 'firstName lastName email')
    .populate('sender', 'firstName lastName email');

  if (!orders.length) {
    return res.status(404).json({ message: 'Aucune commande trouvée pour cet utilisateur.' });
  }

  res.status(200).json({
    message: 'Liste des commandes récupérée avec succès',
    number_orders: orders.length,
    orders,
  });
});

module.exports = {
  createOrder,
  acceptOrder,
  rejectOrder,
  markOrderAsPaid,
  getAllOrders,
  getOrderById,
  acceptOrderByTransporter,
  rejectOrderByTransporter,
  getUserOrders,
};