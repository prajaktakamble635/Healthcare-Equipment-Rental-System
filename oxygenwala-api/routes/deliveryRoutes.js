const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const upload = require('../lib/upload'); // Assuming upload middleware is here

router.post('/', deliveryController.createDelivery);
router.get('/', deliveryController.getAllDeliveries);
router.put('/:id', upload.single('photoBeforeDelivery'), deliveryController.updateDeliveryStatus);

module.exports = router;
