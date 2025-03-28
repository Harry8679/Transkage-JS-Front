const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Trip = require('../../models/trip.model'); // ⚠️ adapte ce chemin à ton projet
const User = require('../../models/user.model');

let mongoServer;

jest.setTimeout(20000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Trip Model', () => {
  let author;

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();

    author = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'securepass',
      role: 'user',
    });
  });

  it('✅ Devrait créer un trajet valide avec calcul de priceTranskage', async () => {
    const trip = await Trip.create({
      departureCountry: 'France',
      arrivalCountry: 'Canada',
      selectedTransport: 'avion',
      departureCity: 'Paris',
      arrivalCity: 'Montréal',
      departureDate: new Date(),
      departureTime: '09:00',
      arrivalDate: new Date(),
      arrivalTime: '15:00',
      kilos: 40,
      pricePerKilo: 10,
      author: {
        _id: author._id,
        firstName: author.firstName,
        lastName: author.lastName,
        avatar: 'https://example.com/avatar.jpg',
        email: author.email,
      },
    });

    expect(trip._id).toBeDefined();
    expect(trip.priceTranskage).toBe(12); // 10 * 1.2, arrondi
  });

  it('❌ Devrait rejeter un trajet sans champ requis', async () => {
    try {
      await Trip.create({
        // Pas de arrivalCountry
        departureCountry: 'France',
        selectedTransport: 'avion',
        departureCity: 'Paris',
        arrivalCity: 'Montréal',
        departureDate: new Date(),
        departureTime: '09:00',
        arrivalDate: new Date(),
        arrivalTime: '15:00',
        kilos: 20,
        pricePerKilo: 9,
        author: {
          _id: author._id,
          firstName: author.firstName,
          lastName: author.lastName,
          avatar: 'https://example.com/avatar.jpg',
          email: author.email,
        },
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.errors.arrivalCountry).toBeDefined();
    }
  });

  it('✅ Devrait recalculer priceTranskage lors d’un update', async () => {
    const trip = await Trip.create({
      departureCountry: 'France',
      arrivalCountry: 'Espagne',
      selectedTransport: 'bus',
      departureCity: 'Lyon',
      arrivalCity: 'Barcelone',
      departureDate: new Date(),
      departureTime: '08:00',
      arrivalDate: new Date(),
      arrivalTime: '14:00',
      kilos: 25,
      pricePerKilo: 8,
      author: {
        _id: author._id,
        firstName: author.firstName,
        lastName: author.lastName,
        avatar: 'https://example.com/avatar.jpg',
        email: author.email,
      },
    });

    const updated = await Trip.findOneAndUpdate(
      { _id: trip._id },
      { pricePerKilo: 11 },
      { new: true }
    );

    expect(updated.pricePerKilo).toBe(11);
    expect(updated.priceTranskage).toBe(13.2); // 11 * 1.2 = 13.2
  });
});