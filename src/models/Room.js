const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    placeType: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TypePlace",
      },
    ],
    propertyType: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyType",
      },
    ],
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    beds: {
      type: Number,
      required: true,
      min: 0,
    },
    baths: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Amenity",
      },
    ],
    images: [
      {
        type: Object,
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

roomSchema.index({ location: "2dsphere" });
roomSchema.plugin(paginate);
const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
