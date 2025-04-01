const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Order = require('../../models/order.model');
const Trip = require('../../models/trip.model');
const sendMailOrder = require('../../utils/sendEmailOrder');

jest.mock('../../utils/sendEmailOrder');

describe('📦 Order Controller', () => {
  let token;
  let trip;
  let userId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    // Simuler un utilisateur connecté (req.user)
    app.use((req, res, next) => {
      req.user = { _id: userId };
      next();
    });

    // Créer un faux trajet
    trip = await Trip.create({
      kilos: 100,
      pricePerKilo: 10,
      priceTranskage: 15,
      author: { _id: new mongoose.Types.ObjectId() },
    });
  });

  afterAll(async () => {
    await Order.deleteMany();
    await Trip.deleteMany();
    mongoose.connection.close();
  });

  describe('✅ Création de commande', () => {
    it('devrait créer une commande avec succès', async () => {
      const res = await request(app).post('/api/v1/orders').send({
        kilos: 5,
        productDescription: 'Produit test',
        productDimensions: '10x10x10',
        tripId: trip._id,
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/succès/i);
      expect(res.body.order.kilos).toBe(5);
    });

    it('devrait échouer si pas assez de kilos', async () => {
      const res = await request(app).post('/api/v1/orders').send({
        kilos: 1000,
        productDescription: 'Test',
        productDimensions: '1x1x1',
        tripId: trip._id,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/dépasse/i);
    });

    it('devrait échouer si utilisateur non authentifié', async () => {
      const appNoAuth = require('express')();
      appNoAuth.use(require('express').json());
      appNoAuth.post('/api/v1/orders', require('../../controllers/order.controller').createOrder);

      const res = await request(appNoAuth).post('/api/v1/orders').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('✅ Validation par transporteur', () => {
    let order;

    beforeEach(async () => {
      order = await Order.create({
        kilos: 5,
        productDescription: 'Test',
        productDimensions: '10x10x10',
        secretCode: '123456',
        pricePerKilo: 10,
        priceTranskage: 15,
        totalPriceTransporter: 50,
        totalPriceTranskage: 75,
        sender: userId,
        transporter: trip.author._id,
        trip: trip._id,
      });
    });

    it('devrait valider la commande', async () => {
      const res = await request(app).put(`/api/v1/orders/${order._id}/accept`).send();
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/validée/i);
      expect(res.body.order.trackingStatus).toMatch(/validée/i);
    });

    it('devrait refuser la commande', async () => {
      const res = await request(app).put(`/api/v1/orders/${order._id}/reject`).send();
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/refusée/i);
      expect(res.body.order.trackingStatus).toMatch(/refus/i);
    });
  });

  describe('💸 Marquer comme payé', () => {
    let order;

    beforeEach(async () => {
      order = await Order.create({
        kilos: 3,
        pricePerKilo: 10,
        priceTranskage: 20,
        totalPriceTransporter: 30,
        totalPriceTranskage: 60,
        secretCode: '999999',
        sender: { _id: userId, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
        transporter: { _id: trip.author._id, firstName: 'Trans', lastName: 'Porter', email: 'tp@example.com' },
        trip: trip._id,
      });
    });

    it('devrait marquer une commande comme payée', async () => {
      const res = await request(app).put(`/api/v1/orders/${order._id}/mark-as-paid`).send();
      expect(res.status).toBe(200);
      expect(res.body.order.isPaid).toBe(true);
      expect(sendMailOrder).toHaveBeenCalledTimes(2);
    });
  });
});