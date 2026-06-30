const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {
  userTbl,
  websiteConfigTbl,
  loginHistoryTbl,
  customerTbl,
  rentalAgreementTbl,
  equipmentMasterTbl,
  salesBillingTbl,
  salesBillingItemsTbl,
  deliveryTbl
} = require("../sequelize");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const wlogger = require("../logger");
const { handleSequelizeError } = require("../sequelizeErrorHandler");
const {
  SECRET_KEY_ADMIN,
  NODE_ENV,
  COOKIE_DOMAIN_API,
  PUBLIC_DOCUMENT_PATH,
} = require("../config");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { encrypt, decrypt } = require("../lib/cryptoUtils.js");
const PdfPrinter = require("pdfmake");
const fs = require("fs");

const storageOptions = {
  destination: function (req, file, cb) {
    cb(null, PUBLIC_DOCUMENT_PATH);
  },
  filename: async function (req, file, cb) {
    try {
      const detailsObj = await websiteConfigTbl.findByPk(1);
      const srno = detailsObj.documentUploadCounter;
      await detailsObj.update({ documentUploadCounter: srno + 1 });
      const uniqueId = crypto.randomBytes(3).toString("hex");
      const filename = uniqueId + srno + path.extname(file.originalname);
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  },
};

const fileFilter = function (req, file, cb) {
  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".pdf",
    ".webp",
    ".xlsx",
    ".xls",
    ".csv",
  ];
  const ext = path.extname(file.originalname);
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid files"));
  }
};

const limits = {
  fileSize: 1024 * 1024 * 15,
};

const documentUpload = multer({
  storage: multer.diskStorage(storageOptions),
  fileFilter,
  limits,
}).single("file");

const generateBcryptSalt = async () => {
  const saltRounds = 10; // Number of rounds for salt generation
  const salt = await bcrypt.genSalt(saltRounds);
  return salt;
};

const publicController = {};

publicController.downloadDocument = async function (req, res) {
  try {
    const options = {
      root: path.join(__dirname, "../public"),
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true,
      },
    };
    const fileName = req.query.name;
    res.sendFile(fileName, options, function (err) {
      if (err)
        handleSequelizeError(err, res, "publicController.downloadDocument");
    });
  } catch (err) {
    handleSequelizeError(err, res, "publicController.downloadDocument");
  }
};

publicController.uploadDocument = async function (req, res) {
  try {
    documentUpload(req, res, async function (err) {
      if (err instanceof multer.MulterError || err) {
        if (err.code === "LIMIT_FILE_SIZE")
          return res
            .status(413)
            .json({ error: "File size is too large. Max limit is 15MB" });
        else handleSequelizeError(err, res, "publicController.uploadDocument");
      } else if (req.file && req.file.filename) {
        res.status(200).json({ fname: req.file.filename });
      } else
        handleSequelizeError(
          new Error("File not uploaded"),
          res,
          "publicController.uploadDocument"
        );
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.uploadDocument");
  }
};

publicController.verifyUsername = async function (req, res) {
  const { mobile } = req.body;
  try {
    const userTblObj = await userTbl.findOne({
      where: {
        mobile: mobile,
        status: 1,
      },
    });
    if (userTblObj) {
      return res.json({
        code: 200,
        message: "Username is valid, please enter password.",
        id: userTblObj?.id,
      });
    } else {
      return res.status(400).json({ message: "Invalid Username" });
    }
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.verifyUsername");
  }
};

publicController.verifyPassword = async function (req, res) {
  const { mobile, password } = req.body;
  try {
    const userTblObj = await userTbl.findOne({
      where: {
        mobile: mobile,
        status: 1,
      },
    });
    if (userTblObj) {
      await userTbl.isCorrectPassword(
        userTblObj?.id,
        password,
        async (err, same) => {
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.headers["user-agent"];

          if (err) {
            await loginHistoryTbl.create({ userIdFk: userTblObj.id, ipAddress, userAgent, status: "FAILED" });
            return res.status(500).json({ error: "Incorrect Password" });
          } else {
            if (same) {
              if (
                userTblObj.isTwoFactorEnabled == 1 &&
                userTblObj.isAuthenticated == 1
              ) {
                return res.status(200).json({
                  success: true,
                  message:
                    "2-Factor Authentication is enabled. Please verify authentication code to proceed.",
                  mobile: userTblObj?.mobile,
                  isTwoFactorEnabled: 1,
                  id: userTblObj.id,
                  userRole: userTblObj?.userRole,
                  isAuthenticated: userTblObj?.isAuthenticated,
                });
              }
              const payload = {
                uid: userTblObj.id,
                uType: 1,
                userRole: userTblObj?.userRole,
                branchIdFk: userTblObj?.branchIdFk,
              };
              const date = new Date();
              await userTbl.update(
                {
                  lastLogin: date,
                },
                { where: { id: userTblObj?.id } }
              );
              
              await loginHistoryTbl.create({ userIdFk: userTblObj.id, ipAddress, userAgent, status: "SUCCESS" });

              if (NODE_ENV === "development") {
                const token = jwt.sign(payload, SECRET_KEY_ADMIN, {
                  expiresIn: "8760h",
                });
                const cookieOptions = {
                  maxAge: 31536000000,
                  httpOnly: true,
                };
                return res
                  .cookie("user_auth_token", token, cookieOptions)
                  .status(200)
                  .json({
                    success: true,
                    message: "Login successful",
                    mobile: userTblObj?.mobile,
                    userRole: userTblObj?.userRole,
                    isTwoFactorEnabled: userTblObj?.isTwoFactorEnabled,
                    isAuthenticated: userTblObj?.isAuthenticated,
                  });
              } else {
                const token = jwt.sign(payload, SECRET_KEY_ADMIN, {
                  expiresIn: "12h",
                });
                const cookieOptions = {
                  maxAge: 43200000,
                  httpOnly: true,
                  domain: COOKIE_DOMAIN_API,
                  sameSite: "none",
                  secure: true,
                  path: "/",
                };
                return res
                  .cookie("user_auth_token", token, cookieOptions)
                  .status(200)
                  .json({
                    success: true,
                    message: "Login successful",
                    userRole: userTblObj?.userRole,
                    isTwoFactorEnabled: userTblObj?.isTwoFactorEnabled,
                    isAuthenticated: userTblObj?.isAuthenticated,
                    mobile: userTblObj?.mobile,
                  });
              }
            } else {
              await loginHistoryTbl.create({ userIdFk: userTblObj.id, ipAddress, userAgent, status: "FAILED" });
              return res.status(500).json({ error: "Incorrect Password." });
            }
          }
        }
      );
    } else {
      return res.status(400).json({ message: "Invalid User" });
    }
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.verifyPassword");
  }
};

publicController.logoutAdmin = async function (req, res) {
  const cookieOptions = {
    maxAge: 1000, // 60 seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
    domain:
      process.env.NODE_ENV === "production" ? COOKIE_DOMAIN_API : undefined,
  };
  res.cookie("user_auth_token", "thoy", cookieOptions).sendStatus(200);
};

publicController.updateMyPassword = async function (req, res) {
  try {
    const { password, newPassword } = req.body
    const salt = await generateBcryptSalt()
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await userTbl.isCorrectPassword(req.uid, password, (err, same) => {
      if (err) {
        res.status(500).json({ error: 'Existing password is incorrect.' })
      } else {
        if (same) {
          try {
            userTbl.update(
              {
                password: hashedPassword,
              },
              {
                where: {
                  id: req.uid
                }
              }
            )
            res.status(200).json({ message: 'Password updated successfully.' })
          } catch (err) {
            handleSequelizeError(err, res, 'publicController.updateMyPassword')
          }
        } else {
          res.status(500).json({ error: 'Existing password is incorrect.' })
        }
      }
    })
  } catch (err) {
    handleSequelizeError(err, res, 'hrController.updateMyPassword')
  }
}

publicController.customerLogin = async function (req, res) {
  const { mobile, password } = req.body;
  try {
    const customer = await customerTbl.findOne({
      where: {
        customerPhone: mobile,
        status: 1,
      },
    });

    if (customer) {
      if (password === "test") {
        const payload = {
          uid: customer.id,
          uType: 2, // 2 for customer
          userRole: 'customer',
        };

        const token = jwt.sign(payload, SECRET_KEY_ADMIN, {
          expiresIn: "12h",
        });

        const cookieOptions = {
          maxAge: 43200000,
          httpOnly: true,
          domain: NODE_ENV === "production" ? COOKIE_DOMAIN_API : undefined,
          sameSite: NODE_ENV === "production" ? "none" : "strict",
          secure: NODE_ENV === "production",
          path: "/",
        };

        return res
          .cookie("customer_auth_token", token, cookieOptions)
          .status(200)
          .json({
            success: true,
            message: "Login successful",
            customerName: customer.customerName,
            token
          });
      } else {
        return res.status(400).json({ error: "Incorrect Password." });
      }
    } else {
      return res.status(400).json({ message: "Mobile number not registered." });
    }
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.customerLogin");
  }
};

publicController.getCustomerAgreements = async function (req, res) {
  try {
    const customerId = req.uid;
    const agreements = await rentalAgreementTbl.findAll({
      where: { customerIdFk: customerId },
      include: [
        {
          model: equipmentMasterTbl,
          as: "equipment",
          attributes: ["id", "modelName", "serialNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, agreements });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.getCustomerAgreements");
  }
};

publicController.getCustomerSalesBills = async function (req, res) {
  try {
    const customerId = req.uid;
    const bills = await salesBillingTbl.findAll({
      where: { customerIdFk: customerId },
      include: [
        {
          model: salesBillingItemsTbl,
          as: "items",
          include: [
            {
              model: equipmentMasterTbl,
              as: "equipment",
              attributes: ["id", "modelName", "serialNumber"],
            }
          ]
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, bills });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.getCustomerSalesBills");
  }
};

publicController.getCustomerDeliveries = async function (req, res) {
  try {
    const customerId = req.uid;
    const deliveries = await deliveryTbl.findAll({
      where: { customerIdFk: customerId },
      include: [
        { model: rentalAgreementTbl, as: 'agreement' },
        { model: equipmentMasterTbl, as: 'equipment', attributes: ['modelName', 'serialNumber'] }
      ],
      order: [["createdAt", "DESC"]]
    });
    res.status(200).json({ success: true, deliveries });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.getCustomerDeliveries");
  }
};

publicController.approveAgreement = async function (req, res) {
  try {
    const customerId = req.uid;
    const { id } = req.body;
    
    const agreement = await rentalAgreementTbl.findOne({
      where: { id: id, customerIdFk: customerId },
    });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found." });
    }

    if (agreement.status !== 4) {
      return res.status(400).json({ success: false, message: "Agreement is not in draft status." });
    }

    // Change status to Awaiting Delivery (Approved)
    await agreement.update({
      status: 5,
    });

    // Create delivery record
    const count = await deliveryTbl.count();
    const deliveryNo = `DEL-${Date.now()}-${count + 1}`;
    await deliveryTbl.create({
      deliveryNo,
      agreementIdFk: agreement.id,
      customerIdFk: agreement.customerIdFk,
      equipmentIdFk: agreement.equipmentIdFk,
      status: 1 // Pending
    });

    res.status(200).json({ success: true, message: "Agreement approved successfully. Awaiting payment and delivery." });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.approveAgreement");
  }
};

publicController.approveAndPayAgreement = async function (req, res) {
  try {
    const customerId = req.uid;
    const { id, paymentMethod } = req.body;
    
    const agreement = await rentalAgreementTbl.findOne({
      where: { id: id, customerIdFk: customerId },
    });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found." });
    }

    if (agreement.status !== 4) {
      return res.status(400).json({ success: false, message: "Agreement is not in draft status." });
    }

    let paymentStatus = 1; // Pending
    let amountPaid = 0;

    if (paymentMethod === 'Online Payment') {
      paymentStatus = 3; // Paid
      amountPaid = parseFloat(agreement.rentalRate) + parseFloat(agreement.depositAmount);
    } else {
      // Cash on Delivery
      paymentStatus = 1; // Pending, will be collected by delivery agent
      amountPaid = 0;
    }

    await agreement.update({
      status: 5,
      paymentStatus: paymentStatus,
      amountPaid: amountPaid,
      paymentMode: paymentMethod
    });

    // Create delivery record
    const count = await deliveryTbl.count();
    const deliveryNo = `DEL-${Date.now()}-${count + 1}`;
    await deliveryTbl.create({
      deliveryNo,
      agreementIdFk: agreement.id,
      customerIdFk: agreement.customerIdFk,
      equipmentIdFk: agreement.equipmentIdFk,
      status: 1 // Pending
    });

    res.status(200).json({ success: true, message: `Payment successful via ${paymentMethod}. Agreement is awaiting delivery.` });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.approveAndPayAgreement");
  }
};

publicController.paySalesBill = async function (req, res) {
  try {
    const customerId = req.uid;
    const { id, paymentMode } = req.body;
    
    const bill = await salesBillingTbl.findOne({
      where: { id: id, customerIdFk: customerId },
    });

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found." });
    }

    if (paymentMode === "Cash") {
      await bill.update({
        paymentMode: "Cash on Delivery"
      });
      return res.status(200).json({ success: true, message: "Order placed. Delivery agent will collect cash on delivery." });
    } else {
      await bill.update({
        paymentStatus: 3, // Paid
        paymentMode: "Online"
      });
      return res.status(200).json({ success: true, message: "Online payment successful!" });
    }
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.paySalesBill");
  }
};

publicController.markSalesDeliveryCustomerComplete = async function (req, res) {
  try {
    const customerId = req.uid;
    const { id } = req.body;
    
    const bill = await salesBillingTbl.findOne({
      where: { id: id, customerIdFk: customerId },
    });

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found." });
    }

    await bill.update({ customerCompleted: 1 });
    
    if (bill.paymentMode === "Cash on Delivery") {
        await bill.update({ paymentStatus: 3 }); // Mark as paid since delivery agent collected cash
    }

    return res.status(200).json({ success: true, message: "Delivery marked as complete by you. Thank you!" });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "publicController.markSalesDeliveryCustomerComplete");
  }
};

publicController.requestReturn = async (req, res) => {
  try {
    const customerId = req.uid;
    const { id } = req.body;
    
    if (!id) return res.status(400).json({ message: "Agreement ID is required." });

    const agreement = await rentalAgreementTbl.findOne({
      where: { id: id, customerIdFk: customerId, status: 1 }
    });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Active agreement not found." });
    }

    const { format } = require("date-fns");
    await agreement.update({
      status: 6, // Return Requested
      returnRequestDate: format(new Date(), "yyyy-MM-dd")
    });

    return res.status(200).json({ success: true, message: "Return requested successfully. Our team will contact you shortly." });
  } catch (err) {
    console.log("Error requestReturn", err);
    handleSequelizeError(err, res, "publicController.requestReturn");
  }
};

module.exports = publicController;