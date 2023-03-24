const express = require("express");
const User = require("../models/User");
const { authAdmin, auth } = require("../middlewares/auth");
const checkoutRouters = express.Router();

checkoutRouters.get("/checkout/price", auth, async (req, res) => {
  try {
  } catch (error) {
    return res.status(200).send({
      error: error.message,
    });
  }
});
