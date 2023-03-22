const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middlewares/auth");
const { check, validationResult } = require("express-validator");
const { multerUploads, uploadToStorage } = require("../middlewares/multer");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const router = express.Router();
const bcrypt = require("bcryptjs");

router.post("/test/mail", async (req, res) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // generated ethereal user
      pass: process.env.APP_GMAIL_PASS,
    },
  });
  ejs.renderFile(
    "emails/verifyEmail.ejs",
    {
      link: "1234.com",
    },
    (err, str) => {
      if (err) {
        return res.status(400).send({
          err,
        });
      } else {
        transporter
          .sendMail({
            from: "19130213@st.hcmuaf.edu.vn", // sender address
            to: "thinhtyt1999@gmail.com", // list of receivers
            subject: "Hello ✔", // Subject line
            text: "Hello world?", // plain text body
            html: str, // html body
          })
          .then((info) => {
            return res.status(200).send({
              info,
              preview: nodemailer.getTestMessageUrl(info),
            });
          })
          .catch((err) => {
            return res.status(400).send({
              err,
            });
          });
      }
    }
  );
});

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
      const {
        email,
        firstName,
        lastName,
        address,
        description,
        phoneNumber,
        gender,
        password,
      } = req.body;
      User.findOne({ email })
        .exec()
        .then((user) => {
          if (user === null) {
            const token = jwt.sign(
              {
                email,
                firstName,
                lastName,
                address,
                description,
                phoneNumber,
                gender,
                password,
              },
              process.env.JWT_KEY,
              {
                expiresIn: "2m",
              }
            );
            let transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.APP_GMAIL_PASS,
              },
            });
            ejs.renderFile(
              "emails/verifyEmail.ejs",
              {
                link: `${process.env.CLIENT_URL}authen/verify/?token=${token}`,
              },
              (err, str) => {
                if (err) {
                  return res.status(400).send({
                    err,
                  });
                } else {
                  transporter
                    .sendMail({
                      from: "19130213@st.hcmuaf.edu.vn", // sender address
                      to: "thinhtyt1999@gmail.com", // list of receivers
                      subject: "Verify your account ✔", // Subject line
                      text: "Verify your account?", // plain text body
                      html: str, // html body
                    })
                    .then((info) => {
                      return res.status(200).send({
                        info,
                        preview: nodemailer.getTestMessageUrl(info),
                        message: "Account verify email sent to " + email,
                      });
                    })
                    .catch((err) => {
                      return res.status(400).send({
                        err,
                      });
                    });
                }
              }
            );
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

// Verify email
router.post("/user/verify/email", async (req, res) => {
  try {
    const token = req.query.token;
    if (token) {
      jwt.verify(token, process.env.JWT_KEY, (err, decodedToken) => {
        if (err) {
          return res.status(400).send({
            error: err.message,
          });
        } else {
          const {
            email,
            firstName,
            lastName,
            address,
            description,
            phoneNumber,
            gender,
            password,
          } = decodedToken;
          const newUser = new User({
            email,
            firstName,
            lastName,
            password,
            address,
            description,
            phoneNumber,
            gender,
          });
          newUser
            .save()
            .then(() => {
              return res.status(200).send({
                message: "Verify email successful, you can sign in now.",
              });
            })
            .catch((err) => {
              return res.status(400).send(err);
            });
        }
      });
    }
  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

// Forgot password
router.post("/user/forgot/pw", async (req, res) => {
  try {
    const email = req.body.email;
    User.findOne({
      email,
    }).then((user) => {
      if (user) {
        const token = jwt.sign(
          { _id: user._id },
          process.env.RESET_PASSWORD_KEY,
          {
            expiresIn: "20m",
          }
        );
        let transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.APP_GMAIL_PASS,
          },
        });
        const link = `${process.env.CLIENT_URL}authen/reset-pw/?token=${token}`;
        ejs.renderFile(
          "emails/resetPw.ejs",
          {
            link,
          },
          (err, str) => {
            if (err) {
              return res.status(400).send({
                err,
              });
            } else {
              transporter
                .sendMail({
                  from: process.env.GMAIL_USER, // sender address
                  to: email, // list of receivers
                  subject: "Reset your password", // Subject line
                  text: "Reset your password", // plain text body
                  html: str, // html body
                })
                .then((info) => {
                  user
                    .updateOne({
                      resetPwLink: token,
                    })
                    .exec()
                    .then(() => {
                      return res.status(200).send({
                        message: "Account recovery email sent to " + email,
                        info,
                        preview: nodemailer.getTestMessageUrl(info),
                      });
                    })
                    .catch((err) => {
                      return res.status(400).send({
                        err,
                      });
                    });
                })
                .catch((err) => {
                  return res.status(400).send({
                    err,
                  });
                });
            }
          }
        );
      } else {
        return res.status(400).send({
          error: "Dont have this email account",
        });
      }
    });
  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

// Reset password by link
router.post("/user/reset/pw/link", async (req, res) => {
  try {
    const { token, newPw } = req.body;
    if (token) {
      jwt.verify(token, process.env.RESET_PASSWORD_KEY, async (err, result) => {
        if (err) {
          return res.status(400).send({
            error: err.message || "Something error",
          });
        } else {
          const { _id } = result;
          User.findOne({
            _id,
            resetPwLink: token,
          }).then(async (user) => {
            if (user) {
              const obj = {
                password: await bcrypt.hash(newPw, 8),
                resetPwLink: "",
              };
              user
                .updateOne({
                  ...obj,
                })
                .then(() => {
                  return res.status(200).send({
                    message: "Update password successful",
                  });
                })
                .catch((err) => {
                  return res.status(400).send({
                    error: err.message || "Something error",
                  });
                });
            } else {
              return res.status(400).send({
                error: "Something error",
              });
            }
          });
        }
      });
    } else {
      return res.status(400).send({
        error: "Something error",
      });
    }
  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

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
    console.log(error);
    return res.status(400).send({
      error: error.message,
    });
  }
});

// Detail user
router.get("/users/me", auth, async (req, res) => {
  return res.send(req.user);
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
            .send({ error: "Có lỗi xảy ra, vui lòng thử lại" });
        }
      })
      .catch((err) => {
        return res.status(500).send(err);
      });
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Update avatar
router.post("/user/me/avatar/update", multerUploads, auth, async (req, res) => {
  try {
    const { publicUrl, hint } = await uploadToStorage(req.file);
    User.findByIdAndUpdate(
      req.user._id,
      {
        profilePic: publicUrl,
        hintPic: hint,
      },
      { new: true }
    )
      .exec()
      .then((user) => {
        res.status(200).send({
          message: "Update avatar successful",
          user,
        });
      })
      .catch((error) => {
        return res.status(500).send({
          error: error.message,
        });
      });
  } catch (error) {
    return res.status(500).send({
      error: error.message,
    });
  }
});

// Update profile
router.put(
  "/user/me/profile/update",
  auth,
  [
    check("firstName", "firstName field is required").not().isEmpty(),
    check("lastName", "lastName field is required").not().isEmpty(),
    check("address", "address field is required").not().isEmpty(),
    check("description", "description field is required").not().isEmpty(),
    check("phoneNumber", "phoneNumber field is required").not().isEmpty(),
    check("phoneNumber", "phoneNumber field is invalid").isMobilePhone(),
    check("gender", "gender field is required").not().isEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array()[0].msg });
      }
      const { firstName, lastName, address, description, phoneNumber, gender } =
        req.body;
      User.findByIdAndUpdate(
        req.user._id,
        {
          firstName,
          lastName,
          address,
          description,
          phoneNumber,
          gender,
        },
        { new: true }
      )
        .exec()
        .then((user) => {
          res.status(200).send({
            message: "Update profile successful",
            user,
          });
        })
        .catch((error) => {
          return res.status(500).send({
            error: error.message,
          });
        });
    } catch (error) {
      return res.status(500).send({
        error: error.message,
      });
    }
  }
);

module.exports = router;
