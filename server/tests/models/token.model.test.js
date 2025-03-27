const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Token = require('../../models/token.model'); // adapte le chemin si besoin
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

describe('Token Model', () => {
  let user;

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();

    user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'securepassword',
      role: 'user',
    });
  });

  it('✅ Devrait créer un token valide', async () => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h plus tard

    const token = await Token.create({
      userId: user._id,
      token: '123456789abcdef',
      expiresAt,
    });

    expect(token._id).toBeDefined();
    expect(token.token).toBe('123456789abcdef');
    expect(token.createdAt).toBeInstanceOf(Date);
    expect(token.expiresAt.getTime()).toBeCloseTo(expiresAt.getTime(), -2);
  });

  it('❌ Devrait échouer si un champ requis est manquant', async () => {
    try {
      await Token.create({
        // token manquant
        userId: user._id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.errors.token).toBeDefined();
    }
  });

  it('✅ Devrait avoir createdAt défini automatiquement', async () => {
    const token = await Token.create({
      userId: user._id,
      token: 'auto-created-date',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    expect(token.createdAt).toBeDefined();
    expect(token.createdAt).toBeInstanceOf(Date);
  });
});