import express from 'express';
import { sendContactMail } from '../controllers/contact.controller';

const router = express.Router();

// Route pour envoyer un mail
router.post('/', sendContactMail);

export default router;
