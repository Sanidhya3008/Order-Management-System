const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  firmName: { type: String, required: true, unique: true },
  firmAddress: { type: String, required: true },
  firmCityState: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phoneNumber: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);