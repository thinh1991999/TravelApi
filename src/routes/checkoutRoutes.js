const express = require("express");
const { check, validationResult } = require("express-validator");
var mongoose = require("mongoose");
const Room = require("../models/Room");
const moment = require("moment");
const Booking = require("../models/Booking");
const { auth } = require("../middlewares/auth");
const {
  checkValidCheckout,
  checkValidCheckoutFinal,
} = require("../middlewares/room");

const checkoutRouters = express.Router();
checkoutRouters.get(
  "/checkout/price",
  checkValidCheckout,
  [
    check("room", "room field is required").not().isEmpty(),
    check("checkin", "checkin field is required").not().isEmpty(),
    check("checkout", "checkout field is required").not().isEmpty(),
    check("adults", "adults field is required").not().isEmpty(),
    check("children", "children field is required").not().isEmpty(),
    check("pets", "pets field is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
    const {
      id,
      checkin,
      checkout,
      adults,
      children,
      pets,
      totalPrice,
      pricePerNight,
      nights,
    } = req;
    return res.status(200).send({
      message: "success",
      data: {
        id,
        checkin,
        checkout,
        adults,
        pets,
        children,
        totalPrice,
        nights,
        pricePerNight,
      },
    });
  }
);

checkoutRouters.get(
  "/checkout/info",
  checkValidCheckout,
  [
    check("room", "room field is required").not().isEmpty(),
    check("checkin", "checkin field is required").not().isEmpty(),
    check("checkout", "checkout field is required").not().isEmpty(),
    check("adults", "adults field is required").not().isEmpty(),
    check("children", "children field is required").not().isEmpty(),
    check("pets", "pets field is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
    const roomId = req.query.room;
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(401).send({ error: "Invalid roomId" });
    }
    try {
      const room = req.room;
      const {
        id,
        checkin,
        checkout,
        adults,
        children,
        pets,
        totalPrice,
        pricePerNight,
        nights,
      } = req;
      return res.status(200).send({
        message: "success",
        data: {
          infoCheckout: {
            id,
            checkin,
            checkout,
            adults,
            pets,
            children,
            totalPrice,
            nights,
            pricePerNight,
          },
          room,
        },
      });
    } catch (error) {
      return res.status(401).send({ error: error.message });
    }
  }
);

checkoutRouters.post(
  "/checkout",
  auth,
  checkValidCheckoutFinal,
  [
    check("user", "user field is required").not().isEmpty(),
    check("room", "room field is required").not().isEmpty(),
    check("checkin", "checkin field is required").not().isEmpty(),
    check("checkout", "checkout field is required").not().isEmpty(),
    check("adults", "adults field is required").not().isEmpty(),
    check("children", "children field is required").not().isEmpty(),
    check("pets", "pets field is required").not().isEmpty(),
    check("status", "status field is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
    const roomId = req.body.room;
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(401).send({ error: "Invalid roomId" });
    }
    try {
      const userid = req.user._id;
      const { checkin, checkout, adults, children, room, pets, status } =
        req.body;
      if (status === "PAY_FULL" || status === "PAY_PART") {
        const booking = new Booking({
          user: userid,
          room: room,
          checkIn: new Date(checkin),
          checkOut: new Date(checkout),
          nights: req.nights,
          adults: adults ,
          children,
          pets: pets,
          totalPrice: req.totalPrice,
        });
        booking.save().then((booking) => {
          Room.findByIdAndUpdate(room, { $push: { bookings: booking._id } })
            .exec()
            .then(() => {
              return res.status(200).send({
                message: "booking successfull",
                data: {
                  booking,
                  room:req.room
                },
              });
            })
            .catch((err) => {
              return res.status(401).send({ error: err.message });
            });
        });
      }else{
        return res.status(401).send({ error: "Invalid data" });
      }
    } catch (error) {
      return res.status(401).send({ error: error.message });
    }
  }
);

checkoutRouters.post(
  "/checkout/test",
  auth,
  [
    check("room", "room field is required").not().isEmpty(),
    check("checkin", "checkin field is required").not().isEmpty(),
    check("checkout", "checkout field is required").not().isEmpty(),
    check("adults", "adults field is required").not().isEmpty(),
    check("children", "children field is required").not().isEmpty(),
    // check("infants", "infants field is required").not().isEmpty(),
    check("pets", "pets field is required").not().isEmpty(),
  ],
  async (req, res) => {
    const userid = req.user._id;
    const { checkin, checkout, adults, children, room, pets } = req.body;
    const booking = new Booking({
      user: userid,
      room: room,
      checkIn: new Date(checkin),
      checkOut: new Date(checkout),
      guests: adults + children,
      pets: pets,
      totalPrice: 123,
    });
    booking.save().then((booking) => {
      Room.findByIdAndUpdate(room, { $push: { bookings: booking._id } })
        .exec()
        .then(() => {
          return res.status(200).send({
            message: "booking successfull",
            booking,
          });
        })
        .catch((err) => {
          return res.status(401).send({ error: err.message });
        });
    });
  }
);

module.exports = checkoutRouters;
