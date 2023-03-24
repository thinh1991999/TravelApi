const express = require("express");
const { check, validationResult } = require("express-validator");
var mongoose = require("mongoose");
const Room = require("../models/Room");
const moment = require("moment");

const checkoutRouters = express.Router();
checkoutRouters.get(
  "/checkout/price",
  [
    check("checkin", "checkin field is required").not().isEmpty(),
    check("checkout", "checkout field is required").not().isEmpty(),
    check("adults", "adults field is required").not().isEmpty(),
    check("children", "children field is required").not().isEmpty(),
    check("infants", "infants field is required").not().isEmpty(),
    check("pets", "pets field is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
    const id = req.query.id;
    console.log(id);
    if (mongoose.isValidObjectId(id)) {
      Room.findById(id).then((room) => {
        if (room) {
          const { checkin, checkout, adults, children, infants, pets } =
            req.query;
          const price = room.pricePerNight;
          const slots = room.guests;
          const slotsC = adults * 1 + children * 1;
          const inTime = moment(new Date(checkin));
          const outTime = moment(new Date(checkout));
          const days = outTime.diff(inTime, "days");
          if (slotsC < slots && slotsC > 0) {
            return res.status(200).send({
              price: price,
              days,
              total: price * days + 20,
              tax: 20,
            });
          } else {
            return res.status(401).send({
              error: "Error",
            });
          }
        } else {
          return res.status(401).send({
            error: "Room not found",
          });
        }
      });
    } else {
      return res.status(401).send({ error: "Invalid id" });
    }

    try {
    } catch (error) {
      return res.status(200).send({
        error: error.message,
      });
    }
  }
);

module.exports = checkoutRouters;
