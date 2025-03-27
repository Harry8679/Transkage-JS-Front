const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  residenceCountry: { type: String },
  idCardFront: { type: String },
  idCardBack: { type: String },
  secondId: { type: String },
  status: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

// Middleware pour hacher le mot de passe
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;