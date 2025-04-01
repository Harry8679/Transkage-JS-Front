const express = require('express');
const { registerUser, loginUser, verifyUser, logoutUser, 
  changePassword, getUserProfile, updateUserProfile } = require('../controllers/user.controller');

const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verification/:token', verifyUser);
router.post('/logout', logoutUser);
router.put('/change-password', protect, changePassword);
router.get('/profile', protect, getUserProfile);
router.put('/update-profile', protect, updateUserProfile);

module.exports = router;