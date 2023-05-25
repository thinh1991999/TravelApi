const express = require("express");
const { authAdmin } = require("../middlewares/auth");
const { multerUploads, uploadToStorage } = require("../middlewares/multer");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const bookingRoutes = express.Router();

// Get booking
bookingRoutes.get("/booking/detail", async (req, res) => {
  try {
    const id = req.query.id;
    if (mongoose.Types.ObjectId.isValid(id)) {
      Booking.findById(id)
        .populate("user")
        .populate("room")
        .exec()
        .then((Booking) => {
          if (Booking) {
            return res.status(200).send({ message: "Success", Booking });
          } else {
            return res
              .status(400)
              .send({ error: "Dont have this id", Booking });
          }
        });
    } else {
      return res.status(401).send({ error: "invalid id" });
    }
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

// Get all
bookingRoutes.get("/booking/all", async (req, res) => {
  try {
    Booking.find({  }).populate('user').populate('room').then((bookings) => {
      return res.status(200).send({ bookings });
    });
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

bookingRoutes.put("/booking/status/update", async (req, res) => {
  try {
    const id = req.query.id;
    if (mongoose.Types.ObjectId.isValid(id)) {
      const status=req.body.status;
      Booking.findByIdAndUpdate(id, {
        status,
      })
        .exec()
        .then((booking) => {
          return res.status(200).json({
            message: "Update Booking successfully!",
            booking: booking,
          });
        })
        .catch((error) => {
          return res.status(401).send({ error: error.message });
        });
    } else {
      return res.status(401).send({
        error: "Invalid id",
      });
    }
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

// // Delete
// categoryRoutes.delete("/category/delete", authAdmin, async (req, res) => {
//   try {
//     const id = req.body.id;
//     Category.findOneAndUpdate(
//       {
//         _id: id,
//       },
//       { isDelete: true },
//       { new: true }
//     )
//       .then((category) => {
//         return res.status(200).send({ category });
//       })
//       .catch((err) => {
//         return res.status(401).send({ error: err.message });
//       });
//   } catch (error) {
//     return res.status(401).send({ error: error.message });
//   }
// });

module.exports = bookingRoutes;
