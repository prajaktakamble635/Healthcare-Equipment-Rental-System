const express = require("express")
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/user-signs");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"));
    }
    cb(null, true);
  },
});

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = 'uploads/customer-docs';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const equipmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = 'uploads/equipment-images';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const uploadEquipmentImg = multer({
  storage: equipmentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const stockTransferStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = 'uploads/stock-transfer-images';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const uploadStockTransferImg = multer({
  storage: stockTransferStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const adminController = require("../controllers/admin.controller.js");
const branchController = require("../controllers/branch.controller.js");
const rentalAgreementController = require("../controllers/rentalAgreement.controller.js");
const deliveryController = require("../controllers/delivery.controller.js");
const rentalPaymentController = require("../controllers/rentalPayment.controller.js");

router.get("/getMyProfile", adminController.getMyProfile);
router.post("/updateMyPassword", adminController.updateMyPassword);

router.post(
  "/uploadEquipmentImage",
  uploadEquipmentImg.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filePath = `uploads/equipment-images/${req.file.filename}`;
    res.status(200).json({
      message: "File uploaded successfully",
      filePath: filePath,
      originalName: req.file.originalname,
    });
  }
);

router.post(
  "/uploadStockTransferImage",
  uploadStockTransferImg.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filePath = `uploads/stock-transfer-images/${req.file.filename}`;
    res.status(200).json({
      message: "File uploaded successfully",
      filePath: filePath,
      originalName: req.file.originalname,
    });
  }
);

//---------------------Product Category Routes ---------------------------------
router.post("/addProductCategory", adminController.addProductCategory);
router.post("/getProductCategoryTableData", adminController.getProductCategoryTableData);
router.post("/updateProductCategory", adminController.updateProductCategory);
router.post("/changeStatusProductCategory", adminController.changeStatusProductCategory);

//---------------------Product Routes -----------------------------------------
router.post("/getProductTableData", adminController.getProductTableData);
router.post("/addProduct", adminController.addProduct);
router.post("/updateProduct", adminController.updateProduct);
router.post("/changeStatusProduct", adminController.changeStatusProduct);
router.get("/getProductCategoryDropdown", adminController.getProductCategoryDropdown);
router.get(
  "/searchProductDropdownForRate",
  adminController.searchProductDropdownForRate
);
router.get("/searchCategoryForDropdown", adminController.searchCategoryForDropdown);

router.get("/searchProductForRateChart", adminController.searchProductForRateChart);

router.get("/getProductDropdown", adminController.getProductDropdown);
router.get("/getAllProductData", adminController.getAllProductData);
router.get("/getProductForSearch", adminController.getProductForSearch)

router.post("/getProductAttributeTableData", adminController.getProductAttributeTableData);
router.post("/addProductAttribute", adminController.addProductAttribute);
router.post("/updateProductAttribute", adminController.updateProductAttribute)
router.post("/changeStatusProductAttribute", adminController.changeStatusProductAttribute);
router.get("/getProductDropdownForRate", adminController.getProductDropdownForRate);
router.post("/getProductRateChartTableData", adminController.getProductRateChartTableData);
router.post("/addProductRateChart", adminController.addProductRateChart);
router.post("/updateProductRateChart", adminController.updateProductRateChart);
router.post("/changeStatusProductRate", adminController.changeStatusProductRate);
router.post("/getRateChangeAnalysis", adminController.getRateChangeAnalysis);

router.get("/getCategoryRateType", adminController.getCategoryRateType);

// adminRoutes.js
router.post("/getProductRate", adminController.getProductRate);

router.post("/validateProductImport", adminController.validateProductImport);
router.post("/importProductBulk", adminController.importProductBulk);
router.post("/deleteAllProducts", adminController.deleteAllProducts);


router.get("/getBasicRateByCategory", adminController.getBasicRateByCategory);

router.post("/updateMyPassword", adminController.updateMyPassword);
router.get(
  "/searchGaugeByCategory",
  adminController.searchGaugeByCategory
);
router.get("/getCategorySearch", adminController.getCategorySearch);

router.post(
  "/addUser",
  upload.single("userSign"),   // 👈 IMPORTANT
  adminController.addUser
);
router.put(
  "/updateUser",
  upload.single("userSign"),   // 👈 REQUIRED
  adminController.updateUser
);
router.post("/getUserTableData", adminController.getUserTableData);
router.post("/changeStatusUser", adminController.changeStatusUser);
router.post("/updateUserAuthorizations", adminController.updateUserAuthorizations);
//------------------- Company Routes ---------------------------
router.get("/getCompanyDetails", adminController.getCompanyDetails);
router.post("/saveCompanyDetails", adminController.saveCompanyDetails);

router.get("/getCustomerById", adminController.getCustomerById);
router.get("/getQuotationById/:id", adminController.getQuotationById);
//------------------- Customer Details -------------------------
router.post("/getTableCustomer", adminController.getTableCustomer);
router.post("/addCustomer", adminController.addCustomer);
router.post("/updateCustomer", adminController.updateCustomer);
router.post("/changeStatusCustomer", adminController.changeStatusCustomer);
router.post("/deleteCustomer", adminController.deleteCustomer);
router.get("/getCustomerHistory/:customerId", adminController.getCustomerHistory);
router.get("/getAllCustomer", adminController.getAllCustomer);
router.get("/getActiveCustomersList", adminController.getActiveCustomersList);
router.get("/getCustomerForSelect", adminController.getCustomerForSelect);
router.post("/getTableCustomerTrash", adminController.getTableCustomerTrash);
router.post("/recoverCustomer", adminController.recoverCustomer);
router.post("/permanentlyDeleteCustomer", adminController.permanentlyDeleteCustomer)
router.post("/addFamilyMember", adminController.addFamilyMember);
router.post("/updateFamilyMember", adminController.updateFamilyMember);
router.post("/deleteFamilyMember", adminController.deleteFamilyMember);
router.get("/getCustomerMembershipDetails", adminController.getCustomerMembershipDetails);
router.post(
  "/uploadCustomerDocument",
  uploadDoc.single("document"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filePath = `customer-docs/${req.file.filename}`;
    res.status(200).json({
      message: "File uploaded successfully",
      filePath: filePath,
      originalName: req.file.originalname,
    });
  }
);

//------------------- Quotation Routes -------------------------
router.post("/getTableQuotation", adminController.getTableQuotation);
router.post("/addQuotation", adminController.addQuotation);
router.post("/changeQuotationStatus", adminController.changeQuotationStatus);
router.post("/toggleQuotationStatus", adminController.toggleQuotationStatus);
router.get("/getQuotationDetailsById", adminController.getQuotationDetailsById);
router.put("/updateQuotation/:quotationId", adminController.updateQuotation);

router.post("/generateQuotationPdf", adminController.generateQuotationPdf);
router.get("/downloadQuotation", adminController.downloadQuotation);
router.post("/getTableQuotationTracking", adminController.getTableQuotationTracking);
router.post("/deleteQuotation", adminController.deleteQuotation);
router.post("/getTableQuotationTrash", adminController.getTableQuotationTrash);
router.post("/recoverQuotation", adminController.recoverQuotation);
router.post("/permanentlyDeletedQuotation", adminController.permanentlyDeletedQuotation);

router.post("/sendQuotationEmail", adminController.sendQuotationEmail);
//----------------------- User Routes ---------------------------------------
router.get("/getUserInfo", adminController.getUserInfo);

//------------------- Branch Routes -----------------------------------------
router.post("/getTableBranch", branchController.getTableBranch);
router.post("/addBranch", branchController.createBranch);
router.get("/getAllBranches", branchController.getAllBranches);
router.put("/updateBranch/:id", branchController.updateBranch);
router.delete("/deleteBranch/:id", branchController.deleteBranch);
router.post("/changeStatusBranch", branchController.changeStatusBranch);

//------------------- Equipment Category Routes -----------------------------
router.post("/getEquipmentCategoryTableData", adminController.getEquipmentCategoryTableData);
router.post("/addEquipmentCategory", adminController.addEquipmentCategory);
router.post("/updateEquipmentCategory", adminController.updateEquipmentCategory);
router.post("/changeStatusEquipmentCategory", adminController.changeStatusEquipmentCategory);
router.get("/getEquipmentCategoryDropdown", adminController.getEquipmentCategoryDropdown);

//------------------- Equipment Master Routes -------------------------------
router.post("/getEquipmentTableData", adminController.getEquipmentTableData);
router.post("/getRentalEquipmentTableData", adminController.getRentalEquipmentTableData);
router.post("/addEquipment", adminController.addEquipment);
router.post("/updateEquipment", adminController.updateEquipment);
router.post("/changeStatusEquipment", adminController.changeStatusEquipment);
router.post("/deleteEquipment", adminController.deleteEquipment);
router.post("/shiftToRentalEquipment", adminController.shiftToRentalEquipment);

//------------------- User / Staff Routes -----------------------------------------
router.post("/addUser", adminController.addUser);
router.put("/updateUser", adminController.updateUser);
router.post("/getUserTableData", adminController.getUserTableData);
router.post("/changeStatusUser", adminController.changeStatusUser);
router.post("/getLoginHistory", adminController.getLoginHistory);

router.get("/getDeliveryStaff", adminController.getDeliveryStaff);
router.get("/getDeliveryTasks", adminController.getDeliveryTasks);
router.post("/assignDeliveryStaffToSalesBill", adminController.assignDeliveryStaffToSalesBill);
router.post("/markSalesDeliveryAgentComplete", adminController.markSalesDeliveryAgentComplete);

//------------------- Stock Transfer Routes ------------------------------------
router.post("/addStockTransfer", adminController.addStockTransfer);
router.post("/getStockTransferTableData", adminController.getStockTransferTableData);
router.post("/updateStockTransferStatus", adminController.updateStockTransferStatus);
router.post("/deleteStockTransfer", adminController.deleteStockTransfer);

router.get("/getEquipmentForTransfer", adminController.getEquipmentForTransfer);
router.get("/getAllEquipmentByBranch", adminController.getAllEquipmentByBranch);

//------------------- Rental Agreement Routes ------------------------------------
router.get("/getRentalAgreements", rentalAgreementController.getRentalAgreements);
router.post("/addRentalAgreement", rentalAgreementController.addRentalAgreement);
router.post("/updateRentalAgreement", rentalAgreementController.updateRentalAgreement);
router.post("/syncRentalAgreementBatch", rentalAgreementController.syncRentalAgreementBatch);
router.post("/deleteRentalAgreement", rentalAgreementController.deleteRentalAgreement);
router.post("/markRentalDelivered", rentalAgreementController.markRentalDelivered);
router.post("/assignDeliveryStaff", rentalAgreementController.assignDeliveryStaff);

//------------------- Delivery Routes ------------------------------------
router.post("/createDelivery", deliveryController.createDelivery);
router.get("/getAllDeliveries", deliveryController.getAllDeliveries);
router.put("/updateDeliveryStatus/:id", upload.single('photoBeforeDelivery'), deliveryController.updateDeliveryStatus);

//------------------- Rental Payment Routes ------------------------------------
router.get("/getPaymentsByAgreement/:agreementId", rentalPaymentController.getPaymentsByAgreement);
router.put("/updatePaymentStatus/:id", rentalPaymentController.updatePaymentStatus);
router.get("/getAllPendingPayments", rentalPaymentController.getAllPendingPayments);
router.post("/generateScheduleForAgreement", rentalPaymentController.generateScheduleForAgreement);

// Customer Portal Auth Routes
const publicController = require("../controllers/public.controller.js");
router.get("/getCustomerAgreements", publicController.getCustomerAgreements);
router.get("/getCustomerSalesBills", publicController.getCustomerSalesBills);
router.get("/getCustomerDeliveries", publicController.getCustomerDeliveries);
router.post("/paySalesBill", publicController.paySalesBill);
router.post("/markSalesDeliveryCustomerComplete", publicController.markSalesDeliveryCustomerComplete);
router.post("/requestReturn", publicController.requestReturn);
router.post("/approveAgreement", publicController.approveAgreement);
router.post("/approveAndPayAgreement", publicController.approveAndPayAgreement);
const salesBillingController = require("../controllers/salesBilling.controller.js");

//------------------- Sales Billing Routes ------------------------------------
router.get("/getSalesBills", salesBillingController.getSalesBills);
router.get("/getSalesBillById", salesBillingController.getSalesBillById);
router.post("/addSalesBill", salesBillingController.addSalesBill);
router.post("/updateSalesBill", salesBillingController.updateSalesBill);
router.post("/deleteSalesBill", salesBillingController.deleteSalesBill);
router.get("/downloadSalesInvoicePdf", salesBillingController.downloadSalesInvoicePdf);

const serviceRequestController = require("../controllers/serviceRequest.controller.js");

//------------------- Service Request Routes ------------------------------------
router.get("/getServiceRequests", serviceRequestController.getServiceRequests);
router.get("/getServiceRequestById", serviceRequestController.getServiceRequestById);
router.post("/addServiceRequest", serviceRequestController.addServiceRequest);
router.post("/updateServiceRequest", serviceRequestController.updateServiceRequest);
router.post("/deleteServiceRequest", serviceRequestController.deleteServiceRequest);

const maintenanceController = require("../controllers/maintenance.controller.js");

//------------------- Maintenance Routes ------------------------------------
router.get("/getMaintenanceRecords", maintenanceController.getMaintenanceRecords);
router.get("/getMaintenanceById", maintenanceController.getMaintenanceById);
router.post("/addMaintenanceRecord", maintenanceController.addMaintenanceRecord);
router.post("/updateMaintenanceRecord", maintenanceController.updateMaintenanceRecord);
router.post("/deleteMaintenanceRecord", maintenanceController.deleteMaintenanceRecord);

const reportsController = require("../controllers/reports.controller.js");
//------------------- Reports Routes ------------------------------------
router.get("/getReports", reportsController.getReports);

const notificationSettingsController = require("../controllers/notificationSettings.controller.js");
//------------------- Notification Routes ------------------------------------
router.get("/getNotificationSettings", notificationSettingsController.getSettings);
router.post("/updateNotificationSettings", notificationSettingsController.updateSettings);

module.exports = router;