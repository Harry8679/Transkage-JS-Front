const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  kilosBought: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  purchaseCode: { type: String, required: true, unique: true },
  isCodeUsed: { type: Boolean, default: false}
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
