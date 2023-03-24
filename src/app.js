const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const http = require("http");
const { Server } = require("socket.io");
var cors = require("cors");
var bodyParser = require("body-parser");
const userRouter = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const amenityRoutes = require("./routes/amenityRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const propertyTypeRoutes = require("./routes/propertyTypeRoutes");
const typePlaceRoutes = require("./routes/typePlaceRoutes");
const checkoutRouters = require("./routes/checkoutRoutes");

const { connectDb } = require("./config/db");
const startSocket = require("./socket/socket");

connectDb();

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5173",
    methods: ["GET", "POST"],
  },
});
app.use(cors());
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
console.log(express.static(__dirname + "emails/images"));
app.use(bodyParser.json());
app.use("/images", express.static("public/images"));
app.get("/", function (req, res) {
  return res.send("Hello GET");
});

app.use(userRouter);
app.use(roomRoutes);
app.use(amenityRoutes);
app.use(categoryRoutes);
app.use(adminRoutes);
app.use(reviewRoutes);
app.use(propertyTypeRoutes);
app.use(typePlaceRoutes);
app.use(checkoutRouters);

startSocket(io);
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
