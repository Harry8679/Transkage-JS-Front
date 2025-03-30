const User = require('../models/user.model');
const Token = require('../models/token.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendMail = require('../utils/sendEmail');
const asyncHandler = require('express-async-handler');
require('dotenv').config();

// Générer un JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// ✅ Inscription
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body || {};

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }

  if (password.length < 7) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir plus de 6 caractères' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
  }

  const user = await User.create({ firstName, lastName, email, password });

  const resetToken = crypto.randomBytes(32).toString('hex') + user._id;
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await new Token({
    userId: user._id,
    token: hashedToken,
    expiresAt: Date.now() + 60 * 60 * 1000,
  }).save();

  const resetUrl = `${process.env.FRONTEND_URI}/verification/${resetToken}`;

  try {
    await sendMail(
      'Vérification de compte',
      user.email,
      process.env.EMAIL_USER,
      process.env.EMAIL_USER,
      'verification',
      user.firstName,
      user.lastName,
      resetUrl
    );
    console.log('Email de vérification envoyé.');
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
  }

  res.status(201).json({
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token: hashedToken,
    },
  });
});

// ✅ Connexion
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Veuillez renseigner l'email et le mot de passe." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Utilisateur non trouvé, veuillez vous inscrire." });
  }

  if (!user.status || user.status === 0) {
    return res.status(400).json({
      message: "Veuillez vérifier votre email en cliquant sur le lien que vous avez reçu lors de l'inscription.",
    });
  }

  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  if (!passwordIsCorrect) {
    return res.status(400).json({ message: "Email ou mot de passe invalide." });
  }

  const token = generateToken(user._id.toString());

  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: 'none',
    secure: true,
  });

  res.status(200).json({ email: user.firstName, token });
});

// ✅ Vérification email
const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const tokenRecord = await Token.findOne({ token: hashedToken });

  if (!tokenRecord) {
    return res.status(400).json({ message: 'Jeton invalide ou expiré.' });
  }

  const user = await User.findById(tokenRecord.userId);
  if (!user) {
    return res.status(400).json({ message: 'Utilisateur non trouvé.' });
  }

  if (user.status === 1) {
    return res.status(400).json({ message: 'Compte déjà vérifié.' });
  }

  user.status = 1;
  await user.save();

  return res.redirect(`${process.env.FRONTEND_URI}/?verified=true`);
});

// ✅ Déconnexion
const logoutUser = async (req, res) => {
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'none',
    secure: true,
  });

  res.status(200).json({ message: 'Déconnexion réussie.' });
};

// ✅ Changer mot de passe
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé." });
  }

  const passwordIsCorrect = await user.comparePassword(oldPassword);
  if (!passwordIsCorrect) {
    return res.status(400).json({ message: "Ancien mot de passe incorrect." });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Mot de passe modifié avec succès." });
});

// ✅ Profil utilisateur
const getUserProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non autorisé, utilisateur non connecté' });
  }

  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  res.status(200).json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar || '',
    residenceCountry: user.residenceCountry || '',
  });
});

// ✅ Modifier le profil
const updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, residenceCountry, avatar } = req.body;
  const user = await User.findById(req.user?._id);

  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé.' });
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;
  user.phone = phone || user.phone;
  user.residenceCountry = residenceCountry || user.residenceCountry;
  user.avatar = avatar || user.avatar;

  const updatedUser = await user.save();

  res.status(200).json({
    message: 'Profil mis à jour avec succès',
    user: {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      residenceCountry: updatedUser.residenceCountry,
      avatar: updatedUser.avatar,
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
  verifyUser,
  logoutUser,
  changePassword,
  getUserProfile,
  updateUserProfile,
};