const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const Order = require('../../models/order.model');
const Trip = require('../../models/trip.model');
const sendMailOrder = require('../../utils/sendEmailOrder');
const {
  createOrder,
  acceptOrderByTransporter,
  rejectOrderByTransporter,
  markOrderAsPaid,
} = require('../../controllers/order.controller');

jest.mock('../../utils/sendEmailOrder');

describe('📦 Order Controller', () => {
  let trip;
  let userId = new mongoose.Types.ObjectId();
  let transporterId = new mongoose.Types.ObjectId();

  const createTestApp = () => {
    const app = express();
    app.use(bodyParser.json());

    // Simuler req.user
    app.use((req, res, next) => {
      req.user = { _id: userId };
      next();
    });

    app.post('/api/v1/orders', createOrder);
    app.put('/api/v1/orders/:orderId/accept', acceptOrderByTransporter);
    app.put('/api/v1/orders/:orderId/reject', rejectOrderByTransporter);
    app.put('/api/v1/orders/:orderId/mark-as-paid', markOrderAsPaid);

    return app;
  };

  const app = createTestApp();

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test-db');
    trip = await Trip.create({
      kilos: 100,
      pricePerKilo: 10,
      priceTranskage: 15,
      selectedTransport: 'avion',
      departureDate: new Date(),
      arrivalDate: new Date(Date.now() + 86400000),
      departureTime: '10:00',
      arrivalTime: '14:00',
      departureCity: 'Paris',
      arrivalCity: 'Abidjan',
      departureCountry: 'France',
      arrivalCountry: "Côte d'Ivoire",
      author: {
        _id: transporterId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    });
  }, 10000);

  afterAll(async () => {
    await Order.deleteMany();
    await Trip.deleteMany();
    await mongoose.connection.close();
  }, 10000);

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
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.post('/api/v1/orders', createOrder);

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
        transporter: transporterId,
        trip: trip._id,
      });
    });

    it('devrait valider la commande', async () => {
      const res = await request(app).put(`/api/v1/orders/${order._id}/accept`).send();
      expect(res.status).toBe(200);
      expect(res.body.order.trackingStatus).toMatch(/validée/i);
    });

    it('devrait refuser la commande', async () => {
      const res = await request(app).put(`/api/v1/orders/${order._id}/reject`).send();
      expect(res.status).toBe(200);
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
        transporter: {
          _id: transporterId,
          firstName: 'Trans',
          lastName: 'Porter',
          email: 'tp@example.com',
        },
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