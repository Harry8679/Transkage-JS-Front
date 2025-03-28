const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers?.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Non autorisé, jeton invalide' });
    }
  } else {
    return res.status(401).json({ message: 'Non autorisé, aucun jeton fourni' });
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    if (user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Accès refusé, administrateur uniquement' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports = {
  protect,
  adminMiddleware,
};