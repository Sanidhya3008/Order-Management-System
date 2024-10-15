const Party = require('../models/party');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const Order = require('../models/order');
const { createLog } = require('./logController');

exports.createParty = async (req, res) => {
  const { firmName, firmAddress, firmCityState, contactPerson, phoneNumber } = req.body;
  try {
    const existingParty = await Party.findOne({ firmName });
    if (existingParty) {
      return res.status(400).json({ message: 'A party with this name already exists' });
    }
    const party = new Party({ firmName, firmAddress, firmCityState, contactPerson, phoneNumber });
    const savedParty = await party.save();
    await createLog(req.user.id, 'Create Party', `Party created: ${firmName}`);
    res.status(201).json(savedParty);
  } catch (error) {
    res.status(500).json({ message: 'Error creating party', error: error.message });
  }
};

exports.getParties = async (req, res) => {
  try {
    const parties = await Party.find();
    res.json(parties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching parties', error: error.message });
  }
};

exports.updateParty = async (req, res) => {
  const { id } = req.params;
  const { firmName, firmAddress, firmCityState, contactPerson, phoneNumber } = req.body;
  try {
      // First, find the original party
      const originalParty = await Party.findById(id);
      if (!originalParty) {
          return res.status(404).json({ message: 'Party not found' });
      }

      // Check if the new firm name already exists (excluding the current party)
      if (firmName !== originalParty.firmName) {
          const existingParty = await Party.findOne({ firmName, _id: { $ne: id } });
          if (existingParty) {
              return res.status(400).json({ message: 'A party with this name already exists' });
          }
      }

      // Update the party
      const updatedParty = await Party.findByIdAndUpdate(
          id,
          { firmName, firmAddress, firmCityState, contactPerson, phoneNumber },
          { new: true }
      );

      // Update party details in all related orders
      await Order.updateMany(
          { 'party.firmName': originalParty.firmName },
          {
              'party.firmName': firmName,
              'party.firmAddress': firmAddress,
              'party.firmCityState': firmCityState,
              'party.contactPerson': contactPerson,
              'party.phoneNumber': phoneNumber
          }
      );

      res.json(updatedParty);
  } catch (error) {
      res.status(500).json({ message: 'Error updating party', error: error.message });
  }
};

exports.deleteParty = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    const deletedParty = await Party.findByIdAndDelete(id);
    if (!deletedParty) {
      return res.status(404).json({ message: 'Party not found' });
    }
    
    // Delete all orders associated with this party
    await Order.deleteMany({ 'party._id': id });
    await createLog(req.user.id, 'Delete Party', `Party deleted: ${deletedParty.firmName}`);
    res.json({ message: 'Party and associated orders deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting party', error: error.message });
  }
};

// Add other party-related controller functions as needed