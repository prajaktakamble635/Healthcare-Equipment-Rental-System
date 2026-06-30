const axios = require('axios');
const jwt = require('jsonwebtoken');
const { SECRET_KEY_ADMIN } = require('./config');

const payload = {
  uid: 1,
  uType: 1,
  userRole: 1,
  branchIdFk: 1
};
const token = jwt.sign(payload, SECRET_KEY_ADMIN, { expiresIn: '1d' });

const testData = {
  id: 1,
  equipmentCategoryIdFk: 4,
  branchIdFk: 2,
  modelName: "7877787787",
  serialNumber: "32432432432",
  purchaseDate: "2026-06-19",
  purchaseRate: 0,
  warrantyPeriod: null,
  images: [],
  warrantyDetails: "",
  rentalRateDaily: 500,
  rentalRateWeekly: 3000,
  rentalRateMonthly: 10000,
  sellingPrice: 6000,
  maintenanceSchedule: "",
  gst: 0,
  status: 1
};

axios.post('http://127.0.0.1:7001/api/adminApi/updateEquipment', testData, {
  headers: {
    Authorization: `Bearer ${token}`
  }
}).then(res => {
  console.log("SUCCESS:", res.data);
}).catch(err => {
  console.error("ERROR:", err.response ? err.response.data : err.message);
});
