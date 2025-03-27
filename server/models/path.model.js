const mongoose = require('mongoose');

const pathSchema = new mongoose.Schema({
  departureCountry: { type: String, required: true },
  arrivalCountry: { type: String, required: true },
  selectedTransport: { type: String, required: true },
  departureCity: { type: String, required: true },
  arrivalCity: { type: String, required: true },
  departureDate: { type: Date, required: true },
  departureTime: { type: String, required: true },
  arrivalDate: { type: Date, required: true },
  arrivalTime: { type: String, required: true },
  kilos: { type: Number, required: true },
});

const Path = mongoose.model('Path', pathSchema);

module.exports = Path;