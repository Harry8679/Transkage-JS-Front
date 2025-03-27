const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

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

// Exporter l'app pour les tests ou import ailleurs
module.exports = app;

// Lancer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}