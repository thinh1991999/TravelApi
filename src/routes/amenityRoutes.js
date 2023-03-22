const express = require("express");
const { authAdmin } = require("../middlewares/auth");
const { multerUploads, uploadToStorage } = require("../middlewares/multer");
const Amenity = require("../models/Amenity");
const mongoose = require("mongoose");

const amenityRoutes = express.Router();

// Create a new amenity
amenityRoutes.post("/amenity", authAdmin, multerUploads, async (req, res) => {
  try {
    const publicUrl = await uploadToStorage(req.file);
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(401).send({
        error: "Invalid data",
      });
    }
    const newAmenity = new Amenity({ name, description, icon_url: publicUrl });
    newAmenity
      .save()
      .then((amen) => {
        console.log(amen);
        return res.status(200).json({
          message: "File uploaded successfully!",
          amenity: amen,
        });
      })
      .catch((err) => {
        return res.status(401).send({ error: err.message });
      });
  } catch (error) {
    console.log(error);
    return res.status(401).send({ error: error.message });
  }
});

amenityRoutes.get("/amenity/all", async (req, res) => {
  try {
    Amenity.find({
      isDelete: false,
    }).then((amenities) => {
      return res.status(200).send({ amenities });
    });
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

// get amenity detail
amenityRoutes.get("/amenity/detail", async (req, res) => {
  try {
    const id = req.query.id;
    if (mongoose.isValidObjectId(id)) {
      Amenity.findById(id)
        .exec()
        .then((amenity) => {
          if (amenity) {
            return res.status(200).send({ message: "Success", amenity });
          } else {
            return res
              .status(400)
              .send({ error: "Dont have this id", amenity });
          }
        });
    } else {
      return res.status(401).send({ error: "invalid id" });
    }
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

// Delete amenity
amenityRoutes.delete("/amenity/delete", authAdmin, async (req, res) => {
  try {
    const id = req.query.id;
    if (mongoose.Types.ObjectId.isValid(id)) {
      Amenity.findOneAndUpdate(
        {
          _id: id,
        },
        { isDelete: true },
        { new: true }
      )
        .then((amenity) => {
          return res.status(200).send({ amenity });
        })
        .catch((err) => {
          return res.status(401).send({ error: err.message });
        });
    } else {
      return res.status(401).send({ error: "Invalid id" });
    }
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

// update
amenityRoutes.put(
  "/amenity/update",
  authAdmin,
  multerUploads,
  async (req, res) => {
    try {
      const publicUrl = await uploadToStorage(req.file);
      const { name, description } = req.body;
      if (!name || !description) {
        return res.status(401).send({
          error: "Invalid data",
        });
      }
      const id = req.query.id;
      if (mongoose.Types.ObjectId.isValid(id)) {
        Amenity.findByIdAndUpdate(id, {
          name,
          description,
          icon_url: publicUrl,
        })
          .exec()
          .then((cate) => {
            return res.status(200).json({
              message: "Update Amenity successfully!",
              category: cate,
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
      console.log(error);
      return res.status(401).send({ error: error.message });
    }
  }
);

module.exports = amenityRoutes;
