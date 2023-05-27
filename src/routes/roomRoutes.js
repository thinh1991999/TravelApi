const express = require("express");
var mongoose = require("mongoose");
const User = require("../models/User");
const { auth, authAdmin } = require("../middlewares/auth");
const { check, validationResult } = require("express-validator");
const Room = require("../models/Room");
const {
  uploadToStorage,
  multerUploads,
  deleteStorage,
} = require("../middlewares/multer");
const { decodeFilterCountRoom } = require("../share/ultils");

const router = express.Router();

// Create a new room
router.post(
  "/room/create",
  auth,
  [
    check("name", "name field is required").not().isEmpty(),
    check("description", "description field is required").not().isEmpty(),
    check("pricePerNight", "pricePerNight field is required").not().isEmpty(),
    check("latitude", "latitude field is required").not().isEmpty(),
    check("longitude", "longitude field is required").not().isEmpty(),
    check("address", "address field is required").not().isEmpty(),
    check("propertyType", "propertyType field is required").not().isEmpty(),
    check("placeType", "placeType field is required").not().isEmpty(),
    check("guests", "guests field is required").not().isEmpty(),
    check("bedrooms", "bedrooms field is required").not().isEmpty(),
    check("beds", "beds field is required").not().isEmpty(),
    check("baths", "baths field is required").not().isEmpty(),
    check("livingRooms", "livingRooms field is required").not().isEmpty(),
    check("images", "images field isn't valid").isArray({ min: 5 }),
    check("amenities", "amenities field isn't valid").isArray({ min: 1 }),
    check("categories", "categories field isn't valid").isArray({ min: 1 }),
  ],
  async (req, res) => {
    try {
      if (!req.user.isAdmin && !req.user.isHost) {
        return res
          .status(401)
          .send({ error: "Not authorized to access this resource" });
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
      }
      const {
        name,
        description,
        pricePerNight,
        locationX,
        locationY,
        address,
        propertyType,
        placeType,
        guests,
        bedrooms,
        beds,
        livingRooms,
        baths,
        amenities = [],
        categories = [],
        images = [],
      } = req.body;
      const newRoom = new Room({
        name,
        description,
        pricePerNight,
        location: {
          type: "Point",
          coordinates: [-110.8571443, 32.4586858],
          address,
        },
        propertyType,
        placeType,
        guests,
        bedrooms,
        livingRooms,
        beds,
        baths,
        amenities,
        categories,
        images,
        owner: req.user._id,
      });
      newRoom
        .save()
        .then((room) => {
          return res.status(200).send({
            message: "Create new room successfully!",
            room: room,
          });
        })
        .catch((err) => {
          return res.status(401).send({ error: err.message });
        });
    } catch (error) {
      return res.status(401).send({ error: error.message });
    }
  }
);

// Update a new room
router.put(
  "/room/update",
  auth,
  [
    check("name", "name field is required").not().isEmpty(),
    check("description", "description field is required").not().isEmpty(),
    check("pricePerNight", "pricePerNight field is required").not().isEmpty(),
    check("latitude", "latitude field is required").not().isEmpty(),
    check("longitude", "longitude field is required").not().isEmpty(),
    check("address", "address field is required").not().isEmpty(),
    check("propertyType", "propertyType field is required").not().isEmpty(),
    check("placeType", "placeType field is required").not().isEmpty(),
    check("guests", "guests field is required").not().isEmpty(),
    check("bedrooms", "bedrooms field is required").not().isEmpty(),
    check("beds", "beds field is required").not().isEmpty(),
    check("baths", "baths field is required").not().isEmpty(),
    check("bedrooms", "bedrooms field is required").not().isEmpty(),
    check("livingRooms", "livingRooms field is required").not().isEmpty(),
    check("images", "images field isn't valid").isArray({ min: 5 }),
    check("amenities", "amenities field isn't valid").isArray({ min: 1 }),
    check("categories", "categories field isn't valid").isArray({ min: 1 }),
  ],
  async (req, res) => {
    try {
      if (!req.user.isAdmin && !req.user.isHost) {
        return res
          .status(401)
          .send({ error: "Not authorized to access this resource" });
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
      }
      const id = req.query.id;
      if (mongoose.Types.ObjectId.isValid(id)) {
        const {
          name,
          description,
          pricePerNight,
          latitude,
          longitude,
          address,
          propertyType,
          placeType,
          guests,
          livingRooms,
          bedrooms,
          beds,
          baths,
          amenities = [],
          categories = [],
          images = [],
        } = req.body;
        Room.findByIdAndUpdate(id, {
          name,
          description,
          pricePerNight,
          location: {
            type: "Point",
            coordinates: [-110.8571443, 32.4586858],
            address,
          },
          propertyType,
          placeType,
          guests,
          bedrooms,
          livingRooms,
          beds,
          baths,
          amenities,
          categories,
          images,
          owner: req.user._id,
        })
          .exec()
          .then((room) => {
            return res.status(200).json({
              message: "Update Room successfully!",
              room: room,
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
  }
);

// Get detail room
router.get("/room", async (req, res) => {
  try {
    const id = req.query.id;
    if (mongoose.isValidObjectId(id)) {
      Room.findById(id)
        .populate("propertyType")
        .populate({
          path: "bookings",
          select: ["checkIn", "checkOut"],
          match: { status: "DONE" },
        })
        .populate({
          path: "owner",
          select: ["email", "firstName", "lastName", "profilePic"],
        })
        .populate("reviews")
        .exec()
        .then((room) => {
          if (room) {
            return res.status(200).send({
              message: "Success",
              room,
            });
          } else {
            return res.status(401).send({
              error: "Room not found",
            });
          }
        });
    } else {
      return res.status(401).send({ error: "Invalid id" });
    }
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

// Get detail room admin
router.get("/room/admin", async (req, res) => {
  try {
    const id = req.query.id;
    if (mongoose.isValidObjectId(id)) {
      Room.findById(id)
        .exec()
        .then((room) => {
          if (room) {
            return res.status(200).send({
              room,
            });
          } else {
            return res.status(401).send({
              error: "Room not found",
            });
          }
        });
    } else {
      return res.status(401).send({ error: "Invalid id" });
    }
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

router.delete("/room/delete", authAdmin, async (req, res) => {
  try {
    const id = req.query.id;
    if (mongoose.isValidObjectId(id)) {
      Room.findOneAndUpdate(
        {
          _id: id,
        },
        { isDeleted: true },
        { new: true }
      ).then((room) => {
        if (room) {
          return res.status(200).send({
            room,
          });
        } else {
          return res.status(401).send({
            error: "Room not found",
          });
        }
      });
    } else {
      return res.status(401).send({ error: "Invalid id" });
    }
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

const options = {
  page: 1,
  limit: 10,
  populate: [
    {
      path: "owner",
      select: ["firstName", "lastName", "profilePic"],
    },
  ],
  collation: {
    locale: "en",
  },
};

router.get("/room/all", async (req, res) => {
  try {
    Room.paginate({ isDeleted: false }, options, function (err, result) {
      return res.status(200).send({
        err,
        result,
      });
    });
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

router.get("/room/filter/count", async (req, res) => {
  try {
    let find = {};
    const {
      minPrice = 0,
      maxPrice = 100000000,
      bathRooms = "ALL",
      bedRooms = "ALL",
      beds = "ALL",
      amenities = [],
      properties = [],
      places = [],
    } = req.query;
    find = {
      pricePerNight: { $lte: maxPrice, $gte: minPrice },
    };
    if (amenities.length > 0) {
      find = {
        ...find,
        amenities: { $all: amenities },
      };
    }
    if (properties.length > 0) {
      find = {
        ...find,
        propertyType: { $all: properties },
      };
    }
    if (places.length > 0) {
      find = {
        ...find,
        placeType: { $all: places },
      };
    }
    console.log(find);
    Room.find({
      ...find,
      ...decodeFilterCountRoom("baths", bathRooms),
      ...decodeFilterCountRoom("bedrooms", bedRooms),
      ...decodeFilterCountRoom("beds", beds),
    })
      .exec()
      .then((rooms) => {
        return res.status(200).send({ rooms: rooms.length });
      })
      .catch((err) => {
        return res.status(200).send({ rooms: 0 });
      });
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

router.get("/room/filter", async (req, res) => {
  try {
    let find = {};
    const {
      minPrice = 0,
      maxPrice = 100000000,
      bathRooms = "ALL",
      bedRooms = "ALL",
      beds = "ALL",
      amenities = [],
      properties = [],
      places = [],
    } = req.query;
    find = {
      pricePerNight: { $lte: maxPrice, $gte: minPrice },
    };
    if (amenities.length > 0) {
      find = {
        ...find,
        amenities: { $all: amenities },
      };
    }
    if (properties.length > 0) {
      find = {
        ...find,
        propertyType: { $all: properties },
      };
    }
    if (places.length > 0) {
      find = {
        ...find,
        placeType: { $all: places },
      };
    }
    Room.find({
      ...find,
      ...decodeFilterCountRoom("baths", bathRooms),
      ...decodeFilterCountRoom("bedrooms", bedRooms),
      ...decodeFilterCountRoom("beds", beds),
    })
      .populate("reviews")
      .populate({
        path: "owner",
        select: ["_id", "firstName", "lastName", "profilePic"],
      })
      .exec()
      .then((rooms) => {
        return res.status(200).send({ rooms: rooms });
      })
      .catch((err) => {
        return res.status(200).send({ rooms: [] });
      });
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

router.get("/room/name/match", async (req, res) => {
  try {
    const name = req.query.name;
    Room.find({
      $or: [
        { name: { $regex: name } },
        {
          location: {
            address: { $regex: name },
          },
        },
      ],
    })
      .populate("reviews")
      .populate({
        path: "owner",
        select: ["_id", "firstName", "lastName", "profilePic"],
      })
      .exec()
      .then((rooms) => {
        return res.status(200).send({ rooms: rooms });
      })
      .catch((err) => {
        return res.status(200).send({ rooms: [] });
      });
  } catch (error) {
    return res.status(401).send({ error: error.message });
  }
});

router.post(
  "/room/image/single",
  authAdmin,
  multerUploads,
  async (req, res) => {
    try {
      const publicUrl = await uploadToStorage(req.file);
      return res.status(200).json({
        message: "File uploaded successfully!",
        url: publicUrl,
      });
    } catch (error) {
      return res.status(401).send({ error });
    }
  }
);

router.post(
  "/room/image/delete",
  authAdmin,
  multerUploads,
  async (req, res) => {
    try {
      const publicUrl = req.body.url;
      deleteStorage(publicUrl)
        .then((vl) => {
          return res.status(200).send({ message: vl });
        })
        .catch((err) => {
          return res.status(401).send({ error: err.message });
        });
    } catch (error) {
      return res.status(401).send({ error: error.message });
    }
  }
);

module.exports = router;
