const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Adjust the path as needed
const Order = require('../models/order');
const User = require('../models/user');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

let token;

beforeAll(async () => {
  // Connect to a test database
    await mongoose.connect(process.env.MONGO_URI_TEST, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Create a test user and get a token
    const testUser = new User({ name: 'Test User', email: 'test@example.com', password: 'password', role: 'owner' });
    await testUser.save();
    const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test@example.com', password: 'password' });
    token = loginResponse.body.token;
});

afterAll(async () => {
    try {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
      } catch (error) {
            console.error('Test teardown failed:', error);
      }
});

describe('Order Routes', () => {
    it('should create a new order', async () => {
        const response = await request(app)
            .post('/api/orders/create')
            .set('Authorization', `Bearer ${token}`)
            .send({
                party: { firmName: 'Test Firm', firmAddress: 'Test Address', firmCityState: 'Test City', contactPerson: 'John Doe', phoneNumber: '1234567890' },
                products: [{ productName: 'Test Product', quantity: 10, rate: 100 }]
            });
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('_id');
    });

    it('should get all orders', async () => {
        const response = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${token}`);
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    // Add more tests for other order routes
});