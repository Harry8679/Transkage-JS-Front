const request = require('supertest');
const app = require('../../app'); // adapte le chemin vers ton app.js
const nodemailer = require('nodemailer');

// Mock de nodemailer
jest.mock('nodemailer');

describe('Contact Mail Controller', () => {
  let sendMailMock;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue('Email envoyé');
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('✅ Devrait envoyer un email avec succès', async () => {
    const response = await request(app)
      .post('/api/v1/contact')
      .send({
        fullName: 'Jean Dupont',
        email: 'jean@example.com',
        phone: '0612345678',
        message: 'Ceci est un message test.',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/succès/i);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(String),
        to: 'harry.maccode@gmail.com',
        replyTo: 'jean@example.com',
        subject: expect.any(String),
        html: expect.stringContaining('Jean Dupont'),
      })
    );
  });

  it('❌ Devrait échouer si des champs sont manquants', async () => {
    const response = await request(app).post('/api/v1/contact').send({
      email: 'jean@example.com',
      phone: '0612345678',
      message: 'Pas de nom',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/obligatoires/i);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('❌ Devrait renvoyer une erreur serveur si l\'envoi échoue', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Send failed'));

    const response = await request(app)
      .post('/api/v1/contact')
      .send({
        fullName: 'Jean Dupont',
        email: 'jean@example.com',
        phone: '0612345678',
        message: 'Test de plantage',
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/erreur/i);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});