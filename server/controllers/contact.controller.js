const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
require('dotenv').config();

const sendContactMail = async (req, res) => {
  const { fullName, email, phone, message } = req.body;

  if (!fullName || !email || !phone || !message) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  // Configurer Nodemailer avec SendGrid
  const transporter = nodemailer.createTransport(
    nodemailerSendgrid({
      apiKey: process.env.SENDGRID_KEY,
    })
  );

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: 'harry.maccode@gmail.com',
    replyTo: email,
    subject: 'Nouveau message de contact',
    html: `
      <p><strong>Nom Complet:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Téléphone:</strong> ${phone}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Votre message a été envoyé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi du mail.", error });
  }
};

module.exports = { sendContactMail };