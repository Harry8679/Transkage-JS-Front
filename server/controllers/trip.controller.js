const Trip = require('../models/trip.model');
const asyncHandler = require('express-async-handler');

// Créer un trajet
const createTrip = asyncHandler(async (req, res) => {
  const {
    departureCountry,
    arrivalCountry,
    selectedTransport,
    departureCity,
    departureDate,
    departureTime,
    arrivalCity,
    arrivalDate,
    arrivalTime,
    kilos,
    pricePerKilo,
  } = req.body;

  if (
    !departureCountry ||
    !arrivalCountry ||
    !selectedTransport ||
    !departureCity ||
    !departureDate ||
    !departureTime ||
    !arrivalCity ||
    !arrivalDate ||
    !arrivalTime ||
    !kilos ||
    !pricePerKilo
  ) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }

  try {
    const newTrip = new Trip({
      departureCountry,
      arrivalCountry,
      selectedTransport,
      departureCity,
      departureDate,
      departureTime,
      arrivalCity,
      arrivalDate,
      arrivalTime,
      kilos,
      pricePerKilo,
      author: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || 'default_avatar_url',
        email: user.email,
      },
    });

    await newTrip.save();

    res.status(201).json({ message: 'Trajet créé avec succès.', trip: newTrip });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la création du trajet.',
      error: error.message || 'Erreur inconnue',
    });
  }
});

// Récupérer tous les trajets avec filtres
const getTrips = asyncHandler(async (req, res) => {
  const { departureCountry, arrivalCountry, departureDate, selectedTransport, departureCity, arrivalCity } = req.query;

  const filters = {};

  if (departureCountry) filters.departureCountry = departureCountry;
  if (arrivalCountry) filters.arrivalCountry = arrivalCountry;
  if (departureDate) filters.departureDate = { $gte: new Date(departureDate) };
  if (selectedTransport) filters.selectedTransport = { $regex: new RegExp(`^${selectedTransport}$`, 'i') };
  if (departureCity) filters.departureCity = { $regex: new RegExp(`^${departureCity}$`, 'i') };
  if (arrivalCity) filters.arrivalCity = { $regex: new RegExp(`^${arrivalCity}$`, 'i') };

  try {
    const trips = await Trip.find(filters).sort({ arrivalDate: -1 });
    res.status(200).json({ message: 'Liste des trajets récupérée avec succès.', number_trips: trips.length, trips });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des trajets.',
      error: error.message || 'Erreur inconnue',
    });
  }
});

// Mettre à jour un trajet
const updateTrip = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const updateData = req.body;

  try {
    const updatedTrip = await Trip.findByIdAndUpdate(tripId, updateData, { new: true });

    if (!updatedTrip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    res.status(200).json({ message: 'Trajet mis à jour avec succès', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du trajet',
      error: error.message || 'Erreur inconnue',
    });
  }
});

// Récupérer un trajet par ID
const getTripById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    res.status(200).json({ message: 'Trajet récupéré avec succès', trip });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération du trajet',
      error: error.message || 'Erreur inconnue',
    });
  }
});

// Récupérer les trajets créés par l'utilisateur connecté
const getUserTrips = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  try {
    const trips = await Trip.find({ 'author._id': user._id });

    res.status(200).json({
      message: 'Liste des trajets de l\'utilisateur récupérée avec succès',
      number_trips: trips.length,
      trips,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des trajets',
      error: error.message || 'Erreur inconnue',
    });
  }
});

module.exports = { createTrip, getTrips, updateTrip, getTripById, getUserTrips };
