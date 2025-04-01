const express = requi('express');
const { sendContactMail } = requi('../controllers/contact.controller');

const router = express.Router();

// Route pour envoyer un mail
router.post('/', sendContactMail);

export default router;
