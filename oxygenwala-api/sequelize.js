const { Sequelize, DataTypes } = require('sequelize')
const { DB_HOST, DB_PASS, DB_PORT, DB_USER, DB_NAME } = require('./config')

//models-import
const userModel = require("./models/user.model.js");
const websiteConfigModel = require("./models/websiteConfig.model.js");
const companyProfileModel = require("./models/companyProfile.model.js");
const customerModel = require("./models/customer.model.js");
const familyMemberModel = require("./models/familyMember.model.js");
const branchModel = require("./models/branch.model.js");
const activityLogModel = require("./models/activityLog.model.js");
const loginHistoryModel = require("./models/loginHistory.model.js");

const basicRateModel = require("./models/productBasicRate.model.js");
const productRateHistoryModel = require("./models/productRateHistory.model.js");
const productCategoryModel = require("./models/productCategory.model.js");
const productModel = require("./models/product.model.js");
const productAttributeModel = require("./models/productAttributes.model.js");
const quotationModel = require("./models/quotation.model.js");
const quotationItemsModel = require("./models/quotationItems.model.js");
const rateChartModel = require("./models/rateChart.model.js");
const quotationTrackingModel = require("./models/quotationTracking.model.js");
const rateChangeLogModel = require("./models/rateChangeLog.model.js");
const equipmentCategoryModel = require("./models/equipmentCategory.model.js");
const equipmentMasterModel = require("./models/equipmentMaster.model.js");
const stockTransferModel = require("./models/stockTransfer.model.js");
const rentalAgreementModel = require("./models/rentalAgreement.model.js");
const salesBillingModel = require("./models/salesBilling.model.js");
const salesBillingItemsModel = require("./models/salesBillingItems.model.js");
const serviceRequestModel = require("./models/serviceRequest.model.js");
const maintenanceModel = require("./models/maintenance.model.js");
const notificationSettingsModel = require("./models/notificationSettings.model.js");
const deliveryModel = require("./models/delivery.model.js");
const rentalPaymentModel = require("./models/rentalPayment.model.js");

const Op = Sequelize.Op;
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
};

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: "mysql",
  port: DB_PORT,
  pool: {
    max: 10,
    min: 0,
    acquire: 150000,
    idle: 1000,
  },
  timezone: "+05:30",
  define: {
    freezeTableName: true,
  },
  logging: false, // change true when there is need to display query in console
  operatorsAliases,
});

const userTbl = userModel(sequelize, Sequelize);
const websiteConfigTbl = websiteConfigModel(sequelize, Sequelize);
const companyProfileTbl = companyProfileModel(sequelize, Sequelize);
const customerTbl = customerModel(sequelize, Sequelize);
const familyMemberTbl = familyMemberModel(sequelize, Sequelize);
const branchTbl = branchModel(sequelize, Sequelize);
const activityLogTbl = activityLogModel(sequelize, Sequelize);
const loginHistoryTbl = loginHistoryModel(sequelize, Sequelize);

const basicRateTbl = basicRateModel(sequelize, Sequelize);
const productRateHistoryTbl = productRateHistoryModel(sequelize, Sequelize);
const productCategoryTbl = productCategoryModel(sequelize, Sequelize);
const productTbl = productModel(sequelize, Sequelize);
const productAttributeTbl = productAttributeModel(sequelize, Sequelize);
const quotationTbl = quotationModel(sequelize, Sequelize);
const quotationItemsTbl = quotationItemsModel(sequelize, Sequelize);
const rateChartTbl = rateChartModel(sequelize, Sequelize);
const quotationTrackingTbl = quotationTrackingModel(sequelize, Sequelize);
const rateChangeLogTbl = rateChangeLogModel(sequelize, Sequelize);
const equipmentCategoryTbl = equipmentCategoryModel(sequelize, Sequelize);
const equipmentMasterTbl = equipmentMasterModel(sequelize, Sequelize);
const stockTransferTbl = stockTransferModel(sequelize, Sequelize);
const rentalAgreementTbl = rentalAgreementModel(sequelize, Sequelize);
const salesBillingTbl = salesBillingModel(sequelize, Sequelize);
const salesBillingItemsTbl = salesBillingItemsModel(sequelize, Sequelize);
const serviceRequestTbl = serviceRequestModel(sequelize, Sequelize);
const maintenanceTbl = maintenanceModel(sequelize, Sequelize);
const notificationSettingsTbl = notificationSettingsModel(sequelize, Sequelize);
const deliveryTbl = deliveryModel(sequelize, Sequelize);
const rentalPaymentTbl = rentalPaymentModel(sequelize, Sequelize);

// Associations
userTbl.belongsTo(branchTbl, { as: 'branch', foreignKey: 'branchIdFk' });
branchTbl.hasMany(userTbl, { as: 'users', foreignKey: 'branchIdFk' });

customerTbl.belongsTo(branchTbl, { as: 'branch', foreignKey: 'branchIdFk' });
branchTbl.hasMany(customerTbl, { as: 'customers', foreignKey: 'branchIdFk' });

familyMemberTbl.belongsTo(customerTbl, { as: 'customer', foreignKey: 'customerIdFk' });
customerTbl.hasMany(familyMemberTbl, { as: 'familyMembers', foreignKey: 'customerIdFk' });

activityLogTbl.belongsTo(userTbl, { as: 'user', foreignKey: 'userIdFk' });
userTbl.hasMany(activityLogTbl, { as: 'activityLogs', foreignKey: 'userIdFk' });

loginHistoryTbl.belongsTo(userTbl, { as: 'user', foreignKey: 'userIdFk' });
userTbl.hasMany(loginHistoryTbl, { as: 'loginHistories', foreignKey: 'userIdFk' });

// Quotation Associations
quotationTbl.belongsTo(customerTbl, { as: 'customer', foreignKey: 'customerIdFk' });
customerTbl.hasMany(quotationTbl, { as: 'quotations', foreignKey: 'customerIdFk' });

quotationTbl.belongsTo(userTbl, { as: 'user', foreignKey: 'userIdFk' });
userTbl.hasMany(quotationTbl, { as: 'quotations', foreignKey: 'userIdFk' });

quotationItemsTbl.belongsTo(quotationTbl, { as: 'quotation', foreignKey: 'quotationIdFk' });
quotationTbl.hasMany(quotationItemsTbl, { as: 'quotationItems', foreignKey: 'quotationIdFk' });

quotationItemsTbl.belongsTo(productTbl, { as: 'product', foreignKey: 'productIdFk' });
productTbl.hasMany(quotationItemsTbl, { as: 'quotationItems', foreignKey: 'productIdFk' });

productTbl.belongsTo(productCategoryTbl, { as: 'category', foreignKey: 'categoryIdFk' });
productCategoryTbl.hasMany(productTbl, { as: 'products', foreignKey: 'categoryIdFk' });

quotationTrackingTbl.belongsTo(quotationTbl, { as: 'quotation', foreignKey: 'quotationIdFk' });
quotationTbl.hasMany(quotationTrackingTbl, { as: 'quotationTrackings', foreignKey: 'quotationIdFk' });

// Equipment Associations
equipmentMasterTbl.belongsTo(equipmentCategoryTbl, { as: 'category', foreignKey: 'equipmentCategoryIdFk' });
equipmentCategoryTbl.hasMany(equipmentMasterTbl, { as: 'equipments', foreignKey: 'equipmentCategoryIdFk' });

equipmentMasterTbl.belongsTo(branchTbl, { as: 'branch', foreignKey: 'branchIdFk' });
branchTbl.hasMany(equipmentMasterTbl, { as: 'equipments', foreignKey: 'branchIdFk' });

// Stock Transfer Associations
stockTransferTbl.belongsTo(equipmentMasterTbl, { as: 'equipment', foreignKey: 'equipmentIdFk' });
equipmentMasterTbl.hasMany(stockTransferTbl, { as: 'stockTransfers', foreignKey: 'equipmentIdFk' });

stockTransferTbl.belongsTo(branchTbl, { as: 'fromBranch', foreignKey: 'fromBranchIdFk' });
stockTransferTbl.belongsTo(branchTbl, { as: 'toBranch', foreignKey: 'toBranchIdFk' });

stockTransferTbl.belongsTo(userTbl, { as: 'transferredBy', foreignKey: 'transferredByIdFk' });
userTbl.hasMany(stockTransferTbl, { as: 'stockTransfers', foreignKey: 'transferredByIdFk' });

// Rental Agreement Associations
rentalAgreementTbl.belongsTo(customerTbl, { as: 'customer', foreignKey: 'customerIdFk' });
customerTbl.hasMany(rentalAgreementTbl, { as: 'rentalAgreements', foreignKey: 'customerIdFk' });

rentalAgreementTbl.belongsTo(equipmentMasterTbl, { as: 'equipment', foreignKey: 'equipmentIdFk' });
equipmentMasterTbl.hasMany(rentalAgreementTbl, { as: 'rentalAgreements', foreignKey: 'equipmentIdFk' });

rentalAgreementTbl.belongsTo(branchTbl, { as: 'branch', foreignKey: 'branchIdFk' });
branchTbl.hasMany(rentalAgreementTbl, { as: 'rentalAgreements', foreignKey: 'branchIdFk' });

// Sales Billing Associations
salesBillingTbl.belongsTo(customerTbl, { as: 'customer', foreignKey: 'customerIdFk' });
customerTbl.hasMany(salesBillingTbl, { as: 'salesBills', foreignKey: 'customerIdFk' });

salesBillingTbl.belongsTo(branchTbl, { as: 'branch', foreignKey: 'branchIdFk' });
branchTbl.hasMany(salesBillingTbl, { as: 'salesBills', foreignKey: 'branchIdFk' });

salesBillingItemsTbl.belongsTo(salesBillingTbl, { as: 'salesBilling', foreignKey: 'salesBillingIdFk' });
salesBillingTbl.hasMany(salesBillingItemsTbl, { as: 'items', foreignKey: 'salesBillingIdFk' });

salesBillingItemsTbl.belongsTo(equipmentMasterTbl, { as: 'equipment', foreignKey: 'equipmentIdFk' });
equipmentMasterTbl.hasMany(salesBillingItemsTbl, { as: 'salesBillingItems', foreignKey: 'equipmentIdFk' });

// Service Request Associations
serviceRequestTbl.belongsTo(customerTbl, { as: 'customer', foreignKey: 'customerIdFk' });
customerTbl.hasMany(serviceRequestTbl, { as: 'serviceRequests', foreignKey: 'customerIdFk' });

serviceRequestTbl.belongsTo(branchTbl, { as: 'branch', foreignKey: 'branchIdFk' });
branchTbl.hasMany(serviceRequestTbl, { as: 'serviceRequests', foreignKey: 'branchIdFk' });

serviceRequestTbl.belongsTo(equipmentMasterTbl, { as: 'equipment', foreignKey: 'equipmentIdFk' });
equipmentMasterTbl.hasMany(serviceRequestTbl, { as: 'serviceRequests', foreignKey: 'equipmentIdFk' });

// Maintenance Associations
maintenanceTbl.belongsTo(equipmentMasterTbl, { as: 'equipment', foreignKey: 'equipmentIdFk' });
equipmentMasterTbl.hasMany(maintenanceTbl, { as: 'maintenanceRecords', foreignKey: 'equipmentIdFk' });

maintenanceTbl.belongsTo(branchTbl, { as: 'branch', foreignKey: 'branchIdFk' });
branchTbl.hasMany(maintenanceTbl, { as: 'maintenanceRecords', foreignKey: 'branchIdFk' });

// Delivery Associations
deliveryTbl.belongsTo(rentalAgreementTbl, { as: 'agreement', foreignKey: 'agreementIdFk' });
rentalAgreementTbl.hasOne(deliveryTbl, { as: 'delivery', foreignKey: 'agreementIdFk' });

deliveryTbl.belongsTo(customerTbl, { as: 'customer', foreignKey: 'customerIdFk' });
customerTbl.hasMany(deliveryTbl, { as: 'deliveries', foreignKey: 'customerIdFk' });

deliveryTbl.belongsTo(userTbl, { as: 'employee', foreignKey: 'employeeIdFk' });
userTbl.hasMany(deliveryTbl, { as: 'deliveries', foreignKey: 'employeeIdFk' });

deliveryTbl.belongsTo(equipmentMasterTbl, { as: 'equipment', foreignKey: 'equipmentIdFk' });
equipmentMasterTbl.hasMany(deliveryTbl, { as: 'deliveries', foreignKey: 'equipmentIdFk' });

// Rental Payment Associations
rentalPaymentTbl.belongsTo(rentalAgreementTbl, { as: 'agreement', foreignKey: 'agreementIdFk' });
rentalAgreementTbl.hasMany(rentalPaymentTbl, { as: 'payments', foreignKey: 'agreementIdFk' });

rentalPaymentTbl.belongsTo(customerTbl, { as: 'customer', foreignKey: 'customerIdFk' });
customerTbl.hasMany(rentalPaymentTbl, { as: 'payments', foreignKey: 'customerIdFk' });

sequelize.sync({}).then(() => {
  console.log('Database & tables synced!')
})

module.exports = {
  userTbl,
  websiteConfigTbl,
  companyProfileTbl,
  customerTbl,
  familyMemberTbl,
  branchTbl,
  activityLogTbl,
  loginHistoryTbl,
  basicRateTbl,
  productRateHistoryTbl,
  productCategoryTbl,
  productTbl,
  productAttributeTbl,
  quotationTbl,
  quotationItemsTbl,
  rateChartTbl,
  quotationTrackingTbl,
  rateChangeLogTbl,
  equipmentCategoryTbl,
  equipmentMasterTbl,
  stockTransferTbl,
  rentalAgreementTbl,
  salesBillingTbl,
  salesBillingItemsTbl,
  serviceRequestTbl,
  maintenanceTbl,
  notificationSettingsTbl,
  deliveryTbl,
  rentalPaymentTbl,
  sequelize,
};
