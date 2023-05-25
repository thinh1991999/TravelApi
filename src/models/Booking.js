const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  nights: {
    type: Number,
    required: true,
  },
  children: {
    type: Number,
    required: true,
  },
  adults: {
    type: Number,
    required: true,
  },
  pets: {
    type: Number,
    required: false,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["PAY_FULL", "PAY_PART", "DONE", "CANCER", "REJECT"],
    default: "PAY_FULL",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
