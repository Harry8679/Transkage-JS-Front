// tests/controllers/contact.controller.test.js

const request = require('supertest');
const app = require('../../app'); // ✅ Assure-toi que ce chemin est correct
const nodemailer = require('nodemailer');

// 🔁 Si tu utilises nodemailer-sendgrid dans ton contrôleur,
// il faut mocker createTransport + sendMail.
jest.mock('nodemailer');

describe('📧 Contact Mail Controller', () => {
  let sendMailMock;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue('Email envoyé avec succès');
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('✅ Devrait envoyer un email avec succès', async () => {
    const res = await request(app).post('/api/v1/contact').send({
      fullName: 'Jean Dupont',
      email: 'jean@example.com',
      phone: '0612345678',
      message: 'Ceci est un message test.',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/succès/i);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'harry.maccode@gmail.com',
        replyTo: 'jean@example.com',
        subject: 'Nouveau message de contact',
        html: expect.stringContaining('Jean Dupont'),
      })
    );
  });

  it('❌ Devrait échouer si des champs sont manquants', async () => {
    const res = await request(app).post('/api/v1/contact').send({
      email: 'jean@example.com',
      phone: '0612345678',
      message: 'Il manque le nom',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/obligatoires/i);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('❌ Devrait renvoyer une erreur serveur si l’envoi échoue', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Échec envoi'));

    const res = await request(app).post('/api/v1/contact').send({
      fullName: 'Jean Dupont',
      email: 'jean@example.com',
      phone: '0612345678',
      message: 'Erreur volontaire',
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/erreur/i);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});