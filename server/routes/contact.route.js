const express = require('express');
const { sendContactMail } = require('../controllers/contact.controller');

const router = express.Router();

// Route pour envoyer un mail
router.post('/', sendContactMail);

module.exports = router;