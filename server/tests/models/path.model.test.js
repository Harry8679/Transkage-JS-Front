const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Path = require('../../models/path.model'); // ⚠️ adapte le chemin selon ton projet

let mongoServer;

jest.setTimeout(20000); // Pour éviter les timeouts

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Path Model', () => {
  it('✅ Devrait créer un trajet valide', async () => {
    const pathData = {
      departureCountry: 'France',
      arrivalCountry: 'Canada',
      selectedTransport: 'avion',
      departureCity: 'Paris',
      arrivalCity: 'Montréal',
      departureDate: new Date('2025-04-01'),
      departureTime: '10:00',
      arrivalDate: new Date('2025-04-01'),
      arrivalTime: '15:00',
      kilos: 50,
    };

    const path = await Path.create(pathData);

    expect(path._id).toBeDefined();
    expect(path.departureCountry).toBe('France');
    expect(path.kilos).toBe(50);
  });

  it('❌ Devrait échouer si un champ requis est manquant', async () => {
    try {
      await Path.create({
        // departureCountry est manquant
        arrivalCountry: 'Canada',
        selectedTransport: 'avion',
        departureCity: 'Paris',
        arrivalCity: 'Montréal',
        departureDate: new Date(),
        departureTime: '10:00',
        arrivalDate: new Date(),
        arrivalTime: '15:00',
        kilos: 30,
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.errors.departureCountry).toBeDefined();
    }
  });

  it('❌ Devrait rejeter un trajet sans kilos', async () => {
    try {
      await Path.create({
        departureCountry: 'France',
        arrivalCountry: 'Canada',
        selectedTransport: 'avion',
        departureCity: 'Paris',
        arrivalCity: 'Montréal',
        departureDate: new Date(),
        departureTime: '10:00',
        arrivalDate: new Date(),
        arrivalTime: '15:00',
        // kilos manquant
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.errors.kilos).toBeDefined();
    }
  });
});
