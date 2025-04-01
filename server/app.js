const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require('cors');

const userRoutes = require('./routes/user.route');
const contactRoutes = require('./routes/contact.route');
const orderRoutes = require('./routes/order.route');
const tripRoutes = require('./routes/trip.route');
const stripePaymentRoutes = require('./routes/stripePayment.route');

const app = express();
app.use(express.json());

// Déterminer l'environnement (par défaut: development)
const env = process.env.NODE_ENV || 'development';

// Choisir la bonne URI MongoDB selon l'environnement
const MONGO_URI =
  env === 'test' ? process.env.MONGO_URI_TEST : process.env.MONGO_URI_DEV;

mongoose.connect(MONGO_URI, {})
  .then(() => console.log(`✅ MongoDB Connected in ${env} mode`))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Route de test
app.get("/", (req, res) => res.send("API Running"));

// Chargement du middleware CORS avant les routes
app.use(cors({
  origin: 'http://localhost:3010', // L'URL de votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Autoriser ces méthodes HTTP
  credentials: true, // Si vous utilisez des cookies ou d'autres méthodes d'authentification
}));

// Utilisez le routeur pour les utilisateurs
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/stripe', stripePaymentRoutes);
// Utiliser les routes des trajets
app.use('/api/v1/trips', tripRoutes);

// Exporter l'app pour les tests ou import ailleurs
module.exports = app;

// Lancer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  const PORT = process.env.PORT || 8500;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}