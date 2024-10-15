const express = require('express');
const connectDB = require('./config');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const partyRoutes = require('./routes/partyRoutes');
const userRoutes = require('./routes/userRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const { initializeStatistics } = require('./controllers/statisticsController');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../inventory-management-ui/build')));
  
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../inventory-management-ui/build', 'index.html'));
    });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);

const createInitialAdminUser = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await User.create({
                name: 'Admin',
                email: 'admin@example.com',
                phoneNumber: '1234567890',
                password: hashedPassword,
                role: 'owner'
            });
            console.log('Initial admin user created');
        }
    } catch (error) {
        console.error('Error creating initial admin user:', error);
    }
};

const startServer = async () => {
    try {
        await connectDB();
        await createInitialAdminUser();
        await initializeStatistics();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app;