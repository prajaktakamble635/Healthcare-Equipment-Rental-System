const express = require("express");
const router = express.Router();
const publicController = require("../controllers/public.controller.js");

router.get("/downloadDocument", publicController.downloadDocument);
router.post("/uploadDocument", publicController.uploadDocument)
router.post("/verifyUsername", publicController.verifyUsername);
router.post("/verifyPassword", publicController.verifyPassword);
router.get('/logoutAdmin', publicController.logoutAdmin);
router.post("/updateMyPassword", publicController.updateMyPassword)

// Customer Portal Routes
router.post("/customer/login", publicController.customerLogin);

module.exports = router;