const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../../models/user.model'); // adapte le chemin
// const { protect, adminMiddleware } = require('../../middleware/auth.middleware'); // adapte le chemin
const { protect, adminMiddleware } = require('../../middlewares/auth.middleware');

let mongoServer;
let app;
let userToken;
let adminToken;
let fakeToken;

jest.setTimeout(20000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // App Express factice
  app = express();
  app.use(express.json());

  // Route protégée simple
  app.get('/protected', protect, (req, res) => {
    res.status(200).json({ message: 'Accès autorisé', user: req.user.email });
  });

  // Route admin
  app.get('/admin', protect, adminMiddleware, (req, res) => {
    res.status(200).json({ message: 'Admin autorisé' });
  });

  // Créer un user et un admin dans la base
  const user = await User.create({
    firstName: 'Normal',
    lastName: 'User',
    email: 'user@test.com',
    password: 'password123',
    role: 'user',
  });

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'adminpassword',
    role: 'admin',
  });

  userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  fakeToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('🛡️ Auth Middleware', () => {
  it('✅ Devrait autoriser un utilisateur avec token valide', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Accès autorisé');
    expect(res.body.user).toBe('user@test.com');
  });

  it('❌ Devrait rejeter une requête sans token', async () => {
    const res = await request(app).get('/protected');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Non autorisé, aucun jeton fourni');
  });

  it('❌ Devrait rejeter un token invalide', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer faketoken.invalid');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Non autorisé, jeton invalide');
  });

  it('❌ Devrait rejeter un token valide mais sans user en DB', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Utilisateur non trouvé');
  });

  it('✅ Devrait autoriser un admin à accéder à la route', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Admin autorisé');
  });

  it('❌ Devrait rejeter un user normal sur route admin', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Accès refusé, administrateur uniquement');
  });
});