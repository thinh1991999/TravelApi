const Booking = require("../models/Booking");
const Room = require("../models/Room");
const moment=require("moment")

const validator = async (req, res, next) => {
  req.checkBody("title").notEmpty().withMessage("Title field is required");
  req
    .checkBody("description")
    .notEmpty()
    .withMessage("description field is required");
  req
    .checkBody("pricePerNight")
    .notEmpty()
    .withMessage("pricePerNight field is required")
    .isFloat({ min: 1, max: 20000000 })
    .withMessage("Price must be a number between 1 and 20000000");
  req
    .checkBody("propertyType")
    .notEmpty()
    .withMessage("propertyType field is required");

  req
    .checkBody("guests")
    .notEmpty()
    .withMessage("guests field is required")
    .isFloat({ min: 1, max: 30 })
    .withMessage("guests must be a number between 1 and 30");
  req
    .checkBody("bedrooms")
    .notEmpty()
    .withMessage("bedrooms field is required")
    .isFloat({ min: 1, max: 30 })
    .withMessage("bedrooms must be a number between 1 and 30");

  req
    .checkBody("beds")
    .notEmpty()
    .withMessage("beds field is required")
    .isFloat({ min: 1, max: 30 })
    .withMessage("beds must be a number between 1 and 30");

  req
    .checkBody("baths")
    .notEmpty()
    .withMessage("baths field is required")
    .isFloat({ min: 1, max: 30 })
    .withMessage("baths must be a number between 1 and 30");

  req
    .checkBody("locationX")
    .notEmpty()
    .withMessage("locationX field is required");

  req
    .checkBody("locationY")
    .notEmpty()
    .withMessage("locationY field is required");

  req.checkBody("address").notEmpty().withMessage("address field is required");

  req
    .checkBody("retype_password")
    .notEmpty()
    .withMessage("Retyp password field is required");

  req
    .asyncValidationErrors()
    .then(function () {
      next();
    })
    .catch(function (errors) {
      req.flash("errors", errors);
      res.status(500).redirect("back");
    });
};

const checkValidCheckout = async (req, res, next) => {
  try {
    const { checkin, checkout, adults, children, pets, room } = req.query;
    const startDate = new Date(checkin);
    const endDate =new Date(checkout);

    const isValid = await Booking.find({
      status:"DONE",
      $or: [
        {
          checkIn: { $lt: endDate },
          checkOut: { $gte: startDate },
        },
        {
          checkIn: { $lte: startDate },
          checkOut: { $gt: startDate },
        },
      ],
    })
      .then((bookings) => {
        const bookedRoomIds = bookings.map((booking) => booking.room);
        return Room.find({ _id: { $nin: bookedRoomIds } })
          .populate("reviews")
          .populate("bookings");
      })
      .then((availableRooms) => {
        const checkIdx = availableRooms.findIndex((vl) => {
          return vl._id.toString() === room;
        });
        
        if (checkIdx === -1) return false;
        req.room = availableRooms[checkIdx];
        const { guests, isAllowBet, pricePerNight } = availableRooms[0];
        const timeDiff = Math.abs(startDate.getTime() - endDate.getTime());
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))+1;
        if(daysDiff<1) return false;
        console.log(2);
        if(!isAllowBet && pets*1>0) return false;
        console.log(3);
        const totalG = adults + children;
        if (totalG<=0 && totalG>guests) return false;
        console.log(4);
        req.id = room;
        req.checkin = startDate;
        req.checkout = endDate;
        req.totalPrice = daysDiff * pricePerNight;
        req.adults = adults;
        req.children = children;
        req.pets = pets;
        req.nights=daysDiff
        req.pricePerNight = pricePerNight;
        return true
      });
    if (isValid){
      next();
    }else{
       return res.status(401).send({ error: "Invaid values" });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).send({ error: "Invaid values" });
  }
};

const checkValidCheckoutFinal = async (req, res, next) => {
  try {
    const { checkin, checkout, adults, children, pets, room } = req.body;
    const startDate = new Date(checkin);
    const endDate = new Date(checkout);
    const isValid = await Booking.find({
      status: "DONE",
      $or: [
        {
          checkIn: { $lt: endDate },
          checkOut: { $gte: startDate },
        },
        {
          checkIn: { $lte: startDate },
          checkOut: { $gt: startDate },
        },
      ],
    })
      .then((bookings) => {
        const bookedRoomIds = bookings.map((booking) => booking.room);
        return Room.find({ _id: { $nin: bookedRoomIds } })
          .populate("reviews")
          .populate("bookings");
      })
      .then((availableRooms) => {
        const checkIdx = availableRooms.findIndex((vl) => {
          return vl._id.toString() === room;
        });

        if (checkIdx === -1) return false;
        req.room = availableRooms[checkIdx];
        const { guests, isAllowBet, pricePerNight } = availableRooms[0];
        const timeDiff = Math.abs(startDate.getTime() - endDate.getTime());
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        if (daysDiff < 1) return false;
        if (!isAllowBet && pets * 1 > 0) return false;
        const totalG = adults + children;
        if (totalG <= 0 && totalG > guests) return false;
        req.id = room;
        req.checkin = startDate;
        req.checkout = endDate;
        req.totalPrice = daysDiff * pricePerNight;
        req.adults = adults;
        req.children = children;
        req.pets = pets;
        req.nights = daysDiff;
        req.pricePerNight = pricePerNight;
        return true;
      });
    if (isValid) {
      next();
    } else {
      return res.status(401).send({ error: "Invaid values" });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).send({ error: "Invaid values" });
  }
};

module.exports = { validator, checkValidCheckout, checkValidCheckoutFinal };
