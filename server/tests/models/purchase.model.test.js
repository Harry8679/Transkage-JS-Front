const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Purchase = require('../../models/purchase.model'); // ⚠️ adapte le chemin si besoin
const User = require('../../models/user.model');
const Trip = require('../../models/trip.model');

let mongoServer;

jest.setTimeout(20000); // Évite les timeouts

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Purchase Model', () => {
  let user;
  let trip;

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();

    user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'securepassword',
      role: 'user',
    });

    trip = await Trip.create({
      departureCountry: 'France',
      arrivalCountry: 'Canada',
      selectedTransport: 'avion',
      departureCity: 'Paris',
      arrivalCity: 'Montréal',
      departureDate: new Date(),
      departureTime: '08:00',
      arrivalDate: new Date(),
      arrivalTime: '14:00',
      kilos: 30,
      pricePerKilo: 10,
      priceTranskage: 12,
      author: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: 'https://example.com/avatar.jpg',
        email: user.email,
      },
    });
  });

  it('✅ Devrait créer un achat valide', async () => {
    const purchase = await Purchase.create({
      user: user._id,
      trip: trip._id,
      kilosBought: 10,
      totalPrice: 120,
      purchaseCode: 'PURCHASE123',
    });

    expect(purchase._id).toBeDefined();
    expect(purchase.purchaseCode).toBe('PURCHASE123');
    expect(purchase.isCodeUsed).toBe(false); // valeur par défaut
  });

  it('❌ Devrait échouer si un champ requis est manquant', async () => {
    try {
      await Purchase.create({
        user: user._id,
        trip: trip._id,
        totalPrice: 100,
        purchaseCode: 'MISSING_KILOS',
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.errors.kilosBought).toBeDefined();
    }
  });

  it('❌ Devrait rejeter un code d’achat dupliqué', async () => {
    await Purchase.create({
      user: user._id,
      trip: trip._id,
      kilosBought: 5,
      totalPrice: 60,
      purchaseCode: 'DUPLICATE_CODE',
    });

    try {
      await Purchase.create({
        user: user._id,
        trip: trip._id,
        kilosBought: 3,
        totalPrice: 36,
        purchaseCode: 'DUPLICATE_CODE', // même code !
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // Erreur Mongo: duplicate key
    }
  });
});