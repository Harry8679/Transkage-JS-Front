const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  kilos: { type: Number, required: true },
  productDescription: { type: String, required: true },
  productDimensions: { type: String, required: true },
  secretCode: { type: String, required: true },
  orderDate: { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false },
  pricePerKilo: { type: Number, required: true },
  priceTranskage: { type: Number, required: true },
  totalPriceTransporter: { type: Number, required: true },
  totalPriceTranskage: { type: Number, required: true },
  trackingStatus: { type: String,
    enum: [
      'en attente de remise au transporteur',
      'commande validée par le transporteur',
      'remis au transporteur',
      'remis au destinataire',
      'refusé',
    ], 
    default: 'en attente de remise au transporteur' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  validateByTransporter: { type: Boolean, default: false }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
