const express = require("express");
const User = require("../models/User");
const { auth } = require("../middlewares/auth");
const { check, validationResult } = require("express-validator");

const router = express.Router();

// Create a new user
router.post(
  "/user/create",
  [
    check("email", "email field is required").not().isEmpty(),
    check("email", "email field is invalid").isEmail(),
    check("firstName", "firstName field is required").not().isEmpty(),
    check("lastName", "lastName field is required").not().isEmpty(),
    check("address", "address field is required").not().isEmpty(),
    check("description", "description field is required").not().isEmpty(),
    check("phoneNumber", "phoneNumber field is required").not().isEmpty(),
    check("phoneNumber", "phoneNumber field is invalid").isMobilePhone(),
    check("gender", "gender field is required").not().isEmpty(),
    check("password", "password field is required").not().isEmpty(),
    check("password", "password field is invalid").isLength(6),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array()[0].msg });
      }
      const { email, firstName, lastName, password } = req.body;
      User.findOne({ email })
        .exec()
        .then((user) => {
          if (user === null) {
            const newUser = new User({ email, firstName, lastName, password });
            newUser
              .save()
              .then(() => {
                return res.status(200).send({
                  message: "Sign up successfull",
                });
              })
              .catch((err) => {
                return res.status(400).send(err);
              });
          } else {
            return res.status(400).send({
              error: "This email is already registered",
            });
          }
        })
        .catch((error) => {
          return res.status(400).send({
            error: error.message,
          });
        });
    } catch (error) {
      return res.status(400).send({
        error: error.message,
      });
    }
  }
);

// Login
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    if (!user) {
      return res
        .status(401)
        .send({ error: "Login failed! Check authentication credentials" });
    }
    const token = await user.generateAuthToken();
    return res.send({ user, token });
  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

// Detail user
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Logout
router.post("/user/me/logout", auth, async (req, res) => {
  // Log user out of the application
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token != req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

// Update
router.post("/users/me/update", auth, async (req, res) => {
  try {
    const {
      phoneNumber,
      firstName,
      lastName,
      bio,
      gender,
      dateOfBirth,
      address,
    } = req.body;

    User.findOneAndUpdate(
      { email: req.email },
      { phoneNumber, firstName, lastName, bio, gender, dateOfBirth, address },
      { runValidators: true }
    )
      .then((user) => {
        if (user) {
          return res.status(200).send({ mess: "Cap nhat thanh cong" });
        } else {
          return res
            .status(500)
            .send({ error: "C?? l???i x???y ra, vui l??ng th??? l???i" });
        }
      })
      .catch((err) => {
        return res.status(500).send(err);
      });
  } catch (error) {
    return res.status(500).send(error);
  }
});

// router.post("/usersTest", async (req, res) => {
//   // Create a new user
//   try {
//     const { email, name, password } = req.body;
//     User.findOne({ email }).exec((err, user) => {
//       if (user) {
//         res.status(400).send({
//           error: "Email n??y ???? ???????c ????ng k??!",
//         });
//         return;
//       }
//       const newUser = new User({ email, name, password });
//       newUser.save((err, success) => {
//         if (err) {
//           res.status(400).send({
//             error: "C?? l???i x???y ra, vui l??ng th??? l???i!",
//           });
//           return;
//         } else {
//           res.status(200).send({
//             mess: "????ng k?? th??nh c??ng!",
//           });
//         }
//       });
//     });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// router.post("/email-activate", async (req, res) => {
//   // activate email
//   try {
//     const { token } = req.body;
//     if (token) {
//       jwt.verify(token, process.env.JWT_KEY, (err, decodedToken) => {
//         if (err) {
//           res.status(400).send({
//             error: "???????ng d???n kh??ng ????ng ho???c ???? h???t h???n!",
//           });
//           return;
//         }
//         const { email, name, password } = decodedToken;
//         User.findOne({ email }).exec((err, user) => {
//           if (user) {
//             res.status(400).send({
//               error: "Email n??y ???? ???????c ????ng k??!",
//             });
//             return;
//           }
//           const newUser = new User({ email, name, password });
//           newUser.save((err, success) => {
//             if (err) {
//               res.status(400).send({
//                 error: "C?? l???i x???y ra, vui l??ng th??? l???i!",
//               });
//               return;
//             } else {
//               res.status(200).send({
//                 mess: "????ng k?? th??nh c??ng!",
//               });
//             }
//           });
//         });
//       });
//     } else {
//       res.status(400).send({
//         error: "Co",
//       });
//     }
//     // await user.save();
//     // const token = await user.generateAuthToken();
//     // res.status(201).send({ user, token });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// router.post("/users/login", async (req, res) => {
//   //Login a registered user
//   try {
//     const { email, password } = req.body;
//     const user = await User.findByCredentials(email, password);
//     if (!user) {
//       return res
//         .status(401)
//         .send({ error: "Login failed! Check authentication credentials" });
//     }
//     const token = await user.generateAuthToken();
//     return res.send({ user, token });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).send(error);
//   }
// });

// router.get("/users/me", auth, async (req, res) => {
//   // View logged in user profile
//   res.send(req.user);
// });

// router.post("/users/me/update/profile", auth, async (req, res) => {
//   // Log user out of the application
//   try {
//     const { phone, name, gender } = req.body;
//     User.findOneAndUpdate(
//       { email: req.email },
//       { phone, name, gender },
//       { runValidators: true },
//       (err, user) => {
//         if (err) {
//           return res
//             .status(500)
//             .send({ error: "C?? l???i x???y ra, vui l??ng th??? l???i" });
//         } else {
//           return res.status(200).send({ mess: "Cap nhat thanh cong" });
//         }
//       }
//     );
//   } catch (error) {
//     return res.status(500).send(error);
//   }
// });

// router.post("/users/forgotPw", async (req, res) => {
//   // Log user out of the application
//   try {
//     const { email } = req.body;
//     User.findOne({ email }, (err, user) => {
//       if (err || !user) {
//         return res.status(400).send({
//           error: "Kh??ng t???n t???i t??i kho???n ????ng k?? v???i email n??y",
//         });
//       }
//       const token = jwt.sign(
//         { _id: user._id },
//         process.env.RESET_PASSWORD_KEY,
//         {
//           expiresIn: "20m",
//         }
//       );
//       const data = {
//         from: "noreply@hello.com",
//         to: email,
//         subject: "Account Activation Link",
//         html: `
//         <h2>Please click on given link to reset your password</h2>
//         <a>${process.env.CLIENT_URL}/authen/resetPw/${token}</a>
//         `,
//       };
//       User.updateOne({ resetPwLink: token }, (err, success) => {
//         if (err) {
//           return res.status(400).send({
//             error: "Link c???p nh???t m???t kh???u x???y ra l???i",
//           });
//         } else {
//           mg.messages().send(data, function (error, body) {
//             if (error) {
//               return res.status(400).send(error);
//             } else {
//               return res.status(200).send({
//                 mess: "Vui l??ng v??o gmail x??c nh???n ?????t l???i m???t kh???u",
//               });
//             }
//           });
//         }
//       });
//     });
//   } catch (error) {
//     return res.status(500).send(error);
//   }
// });

// router.post("/users/reset-pw", async (req, res) => {
//   // Log user out of the application
//   try {
//     const { resetLink, newPw } = req.body;
//     if (resetLink) {
//       if (newPw && newPw.trim().length >= 7) {
//         jwt.verify(
//           resetLink,
//           process.env.RESET_PASSWORD_KEY,
//           async (err, result) => {
//             if (err) {
//               return res.status(400).send({
//                 error: "Link ???? h???t h???n ho???c kh??ng t???n t???i",
//               });
//             } else {
//               const { _id } = result;
//               const obj = {
//                 password: await bcrypt.hash(newPw, 8),
//                 resetPwLink: "",
//               };
//               User.findOneAndUpdate(
//                 { resetPwLink: resetLink },
//                 obj,
//                 { runValidators: true },
//                 (err, user) => {
//                   if (err || !user) {
//                     return res.status(400).send({
//                       error: "Link ???? h???t h???n ho???c kh??ng t???n t???i",
//                     });
//                   } else {
//                     return res.status(200).send({
//                       mess: "?????t l???i m???t kh???u th??nh c??ng",
//                     });
//                   }
//                 }
//               );
//             }
//           }
//         );
//       } else {
//         return res.status(400).send({
//           error: "M???t kh???u kh??ng ????? ??i???u ki???n, vui l??ng t???o l???i",
//         });
//       }
//     } else {
//       return res.status(400).send({
//         error: "C?? l???i x???y ra, vui l??ng th??? l???i",
//       });
//     }
//   } catch (error) {
//     return res.status(500).send(error);
//   }
// });

module.exports = router;
