const mongoose = require("mongoose");
const User = require("../models/User");

const startSocket = (io) => {
  const connection = mongoose.connection;

  io.of("/reviews").on("connection", (socket) => {
    console.log("socket.io: User connected: ", socket.id);
    socket.on("join_room", (data) => {
      socket.join(data);
    });

    socket.on("disconnect", () => {
      console.log("socket.io: User disconnected: ", socket.id);
    });
  });

  io.of("/notifications").on("connection", (socket) => {
    console.log("socket.io: User connected notification: ", socket.id);
    socket.on("join_room", (data) => {
      socket.join(data);
    });
    socket.on("disconnect", () => {
      console.log("socket.io: User disconnected: ", socket.id);
    });
  });

  connection.once("open", () => {
    console.log("MongoDB database connected");

    console.log("Setting change streams");
    const reviewChangeStream = connection
      .collection("reviews")
      .watch([], { fullDocument: "updateLookup" });
    reviewChangeStream.on("change", (change) => {
      switch (change.operationType) {
        case "insert":
          {
            const {
              _id,
              rating,
              description,
              room,
              createdAt,
              updatedAt,
              owner,
            } = change.fullDocument;
            User.findById(owner)
              .select([
                "_id",
                "email",
                "firstName",
                "lastName",
                "profilePic",
                "bio",
                "phoneNumber",
                "gender",
                "dateOfBirth",
                "address",
              ])
              .then((user) => {
                const review = {
                  _id,
                  description,
                  rating,
                  room,
                  createdAt,
                  updatedAt,
                  owner: user,
                };
                io.of("/reviews")
                  .to(room.toString())
                  .emit("new_review", review);
              });
          }
          break;
        case "update": {
          let fullVl = change.fullDocument;
          let { owner, room } = fullVl;
          const id = change.documentKey._id;
          const vlChange = change.updateDescription.updatedFields;
          console.log(vlChange);
          // if (vlChange.likes.length > 0) {
          //   const id = vlChange.likes[0].toString();
          //   User.findById(id)
          //     .select([
          //       "_id",
          //       "email",
          //       "firstName",
          //       "lastName",
          //       "profilePic",
          //       "bio",
          //       "phoneNumber",
          //       "gender",
          //       "dateOfBirth",
          //       "address",
          //     ])
          //     .exec()
          //     .then((user) => {
          //       io.of("/notifications")
          //         .to(owner.toString())
          //         .emit("like_notifications", {
          //           id,
          //           user,
          //         });
          //     });
          // }
          io.of("/reviews").to(room.toString()).emit("update_review", {
            id,
            vlChange,
          });
          break;
        }
        case "delete":
          io.of("/reviews").emit("delete_review", change.documentKey._id);
          break;
        case "replace":
          break;
      }
    });
  });
};

module.exports = startSocket;
