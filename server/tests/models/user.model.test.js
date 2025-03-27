const mongoose = require('mongoose');
const User = require('../models/user.model'); // Importer le modèle
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('User Model Tests', () => {
    it('✅ Devrait créer un utilisateur avec un mot de passe haché', async () => {
        const userData = {
            firstName: "John",
            lastName: "Doe",
            email: "johndoe@example.com",
            password: "password123",
            role: "user"
        };

        const user = new User(userData);
        await user.save();

        expect(user._id).toBeDefined();
        expect(user.password).not.toBe(userData.password); // Le mot de passe doit être haché
        expect(await bcrypt.compare("password123", user.password)).toBe(true); // Vérifier que le hachage est correct
    });

    it('❌ Devrait refuser un utilisateur sans email', async () => {
        const userData = {
            firstName: "Jane",
            lastName: "Doe",
            password: "password123"
        };

        try {
            await new User(userData).save();
        } catch (err) {
            expect(err).toBeDefined();
            expect(err.errors.email).toBeDefined();
        }
    });

    it('✅ Devrait comparer correctement les mots de passe', async () => {
        const user = new User({
            firstName: "Alice",
            lastName: "Smith",
            email: "alice@example.com",
            password: "securepassword",
            role: "admin"
        });

        await user.save();
        const isMatch = await user.comparePassword("securepassword");
        expect(isMatch).toBe(true);

        const isWrong = await user.comparePassword("wrongpassword");
        expect(isWrong).toBe(false);
    });

    it('❌ Devrait empêcher la création d’un utilisateur avec un email en double', async () => {
        const user1 = new User({
            firstName: "Bob",
            lastName: "Marley",
            email: "bob@example.com",
            password: "password123"
        });

        const user2 = new User({
            firstName: "Robert",
            lastName: "Marley",
            email: "bob@example.com",
            password: "password456"
        });

        await user1.save();

        try {
            await user2.save();
        } catch (err) {
            expect(err).toBeDefined();
            expect(err.code).toBe(11000); // Code MongoDB pour duplication de clé unique
        }
    });
});