const nodemailer = require('nodemailer');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const { create } = require('express-handlebars');

const sendEmailOrder = async (
  subject,
  send_to,
  sent_from,
  reply_to,
  template,
  context
) => {
  const transporter = nodemailer.createTransport(
    nodemailerSendgrid({
      apiKey: process.env.SENDGRID_KEY,
    })
  );

  const viewEngine = create({
    extname: '.handlebars',
    layoutsDir: path.resolve('./views/layouts'),
    defaultLayout: '',
    partialsDir: path.resolve('./views/partials'),
  });

  const handlebarOptions = {
    viewEngine,
    viewPath: path.resolve('./views'),
    extName: '.handlebars',
  };

  transporter.use('compile', hbs(handlebarOptions));

  const options = {
    from: sent_from,
    to: send_to,
    replyTo: reply_to,
    subject,
    template,
    context,
  };

  try {
    const info = await transporter.sendMail(options);
    console.log('Email envoyé avec succès:', info.response, send_to);
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email:', err.message);
  }
};

module.exports = sendEmailOrder;