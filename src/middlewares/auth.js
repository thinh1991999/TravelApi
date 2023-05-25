const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const data = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findOne({ _id: data._id, "tokens.token": token });
    
    if (!user) {
      return res
        .status(401)
        .send({ error: "Not authorized to access this resource" });
    }
    req.user = user;
    req.token = token;
    req.email = user.email;
    next();
  } catch (error) {
    return res
      .status(401)
      .send({ error: "Not authorized to access this resource" });
  }
};

const authAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const data = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findOne({ _id: data._id, "tokens.token": token });
    if (!user) {
      return res
        .status(401)
        .send({ error: "Not authorized to access this resource" });
    }
    if (!user.isAdmin) {
      return res
        .status(401)
        .send({ error: "Not authorized to access this resource" });
    }
    req.user = user;
    req.token = token;
    req.email = user.email;
    next();
  } catch (error) {
    return res
      .status(401)
      .send({ error: "Not authorized to access this resource" });
  }
};

module.exports = { auth, authAdmin };
