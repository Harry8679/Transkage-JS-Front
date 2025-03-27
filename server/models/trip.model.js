const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  departureCountry: { type: String, required: true },
  arrivalCountry: { type: String, required: true },
  selectedTransport: { type: String, required: true },
  departureCity: { type: String, required: true },
  departureDate: { type: Date, required: true },
  departureTime: { type: String, required: true },
  arrivalCity: { type: String, required: true },
  arrivalDate: { type: Date, required: true },
  arrivalTime: { type: String, required: true },
  kilos: { type: Number, required: true },
  pricePerKilo: { type: Number, required: true },
  priceTranskage: { type: Number },
  author: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: {
      type: String,
      required: true,
      default: 'default_avatar_url',
    },
    email: { type: String, required: true },
  },
});

// Fonction utilitaire pour arrondir à 2 décimales
function roundUpTwoDecimals(value) {
  return Math.ceil(value * 100) / 100;
}

// Middleware : calcul automatique du prix Transkage avant save
tripSchema.pre('save', function (next) {
  this.priceTranskage = roundUpTwoDecimals(this.pricePerKilo * 1.2);
  next();
});

// Middleware : recalcul lors des updates
tripSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.pricePerKilo) {
    update.priceTranskage = roundUpTwoDecimals(update.pricePerKilo * 1.2);
  }
  next();
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;