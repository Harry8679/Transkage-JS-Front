const Path = require('../models/path.model');

// Créer un trajet
const createPath = async (req, res) => {
  try {
    const { departureCountry, arrivalCountry, selectedTransport, departureCity, arrivalCity, departureDate,
      departureTime, arrivalDate, arrivalTime, kilos } = req.body;

    const newPath = new Path({ departureCountry, arrivalCountry, selectedTransport, departureCity,
      arrivalCity, departureDate, departureTime, arrivalDate, arrivalTime, kilos });

    const savedPath = await newPath.save();
    res.status(201).json(savedPath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du trajet' });
  }
};

// Obtenir tous les trajets
const getAllPaths = async (req, res) => {
  try {
    const paths = await Path.find();
    res.status(200).json(paths);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des trajets' });
  }
};

module.exports = { createPath, getAllPaths };
