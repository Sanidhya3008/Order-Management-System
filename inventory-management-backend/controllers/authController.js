const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createLog } = require('./logController');

exports.registerByOwner = async (req, res) => {
    const { name, email, phoneNumber, password, role, location } = req.body;

    try {
        let user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            phoneNumber,
            password,
            role,
            location: role === 'employee' ? location : undefined
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Send email or message to the user with their credentials
        // ... (email sending code remains the same)
        await createLog(req.user.id, 'Register User', `New user registered: ${name}`);
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({
            $or: [{ email: username }, { phoneNumber: username }]
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                location: user.location
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                createLog(user.id, 'Login', 'User logged in');
                res.json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email, 
                        phoneNumber: user.phoneNumber, 
                        role: user.role,
                        location: user.location,
                        lastLogin: user.lastLogin
                    } 
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        //console.log('User found:', user);
        res.json(user);
    } catch (err) {
        //console.error('Error in getMe:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;
    
        // Find the user
        const user = await User.findById(req.user.id);
    
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
    
        // Check current password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
    
        // Update fields
        user.name = name;
        user.email = email;
        user.phoneNumber = phoneNumber;
    
        await user.save();
    
        // Send back the updated user data (excluding the password)
        const updatedUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role
        };
    
        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        const owner = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(password, owner.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await createLog(req.user.id, 'Delete User', `User deleted: ${deletedUser.name}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};