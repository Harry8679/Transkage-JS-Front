const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../../models/order.model'); // adapte le chemin si nécessaire
const User = require('../../models/user.model');
const Trip = require('../../models/trip.model');

let mongoServer;

jest.setTimeout(20000); // Prévient les timeouts

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Order Model', () => {
  let userSender;
  let userTransporter;
  let trip;

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    // Créer deux utilisateurs factices
    userSender = await User.create({
      firstName: 'Sender',
      lastName: 'User',
      email: 'sender@example.com',
      password: 'password123',
      role: 'user',
    });

    userTransporter = await User.create({
      firstName: 'Transporter',
      lastName: 'User',
      email: 'transporter@example.com',
      password: 'password123',
      role: 'user',
    });

    // Créer un trip fictif
    trip = await Trip.create({
      departureCountry: 'France',
      arrivalCountry: 'Canada',
      selectedTransport: 'avion',
      departureCity: 'Paris',
      departureDate: new Date(),
      departureTime: '10:00',
      arrivalCity: 'Montréal',
      arrivalDate: new Date(),
      arrivalTime: '15:00',
      kilos: 30,
      pricePerKilo: 10,
      priceTranskage: 12,
      author: {
        _id: userTransporter._id,
        firstName: userTransporter.firstName,
        lastName: userTransporter.lastName,
        avatar: 'https://example.com/avatar.png',
        email: userTransporter.email,
      },
    });
  });

  it('✅ Devrait créer une commande valide', async () => {
    const order = await Order.create({
      kilos: 5,
      productDescription: 'Ordinateur portable',
      productDimensions: '30x20x5cm',
      secretCode: 'ABC123',
      pricePerKilo: 10,
      priceTranskage: 12,
      totalPriceTransporter: 50,
      totalPriceTranskage: 60,
      sender: userSender._id,
      transporter: userTransporter._id,
      trip: trip._id,
    });

    expect(order._id).toBeDefined();
    expect(order.trackingStatus).toBe('en attente de remise au transporteur');
    expect(order.isPaid).toBe(false);
    expect(order.validateByTransporter).toBe(false);
  });

  it('❌ Devrait échouer sans champ obligatoire', async () => {
    try {
      await Order.create({
        // kilos manquant
        productDescription: 'Test',
        productDimensions: '10x10x10',
        secretCode: 'CODE123',
        pricePerKilo: 10,
        priceTranskage: 12,
        totalPriceTransporter: 50,
        totalPriceTranskage: 60,
        sender: userSender._id,
        transporter: userTransporter._id,
        trip: trip._id,
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.errors.kilos).toBeDefined();
    }
  });

  it('✅ Devrait accepter un trackingStatus valide', async () => {
    const order = await Order.create({
      kilos: 10,
      productDescription: 'Valise',
      productDimensions: '55x40x20cm',
      secretCode: 'XYZ987',
      pricePerKilo: 15,
      priceTranskage: 18,
      totalPriceTransporter: 150,
      totalPriceTranskage: 180,
      trackingStatus: 'commande validée par le transporteur',
      sender: userSender._id,
      transporter: userTransporter._id,
      trip: trip._id,
    });

    expect(order.trackingStatus).toBe('commande validée par le transporteur');
  });

  it('❌ Devrait rejeter un trackingStatus invalide', async () => {
    try {
      await Order.create({
        kilos: 8,
        productDescription: 'Sac à dos',
        productDimensions: '40x30x10cm',
        secretCode: 'INVALID',
        pricePerKilo: 12,
        priceTranskage: 14,
        totalPriceTransporter: 96,
        totalPriceTranskage: 112,
        trackingStatus: 'envoyé par pigeon',
        sender: userSender._id,
        transporter: userTransporter._id,
        trip: trip._id,
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.errors.trackingStatus).toBeDefined();
    }
  });
});