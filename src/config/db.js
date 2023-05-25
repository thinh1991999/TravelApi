const mongoose = require("mongoose");
const connectDb = () => {
  try {
    mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
    });
  } catch (error) {
    console.log("error");
    throw Error(error);
  }
};

module.exports = { connectDb };
