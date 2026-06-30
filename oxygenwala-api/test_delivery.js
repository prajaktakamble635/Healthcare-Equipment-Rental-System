const { rentalAgreementTbl, customerTbl, equipmentMasterTbl, salesBillingTbl } = require("./sequelize");
const { Op } = require("sequelize");

async function run() {
  try {
    const userId = 1; // dummy
    
    console.log("Fetching rental tasks...");
    const rentalTasks = await rentalAgreementTbl.findAll({
      where: {
        deliveryStaffIdFk: userId,
        status: { [Op.in]: [4, 5] }
      },
      include: [
        { model: customerTbl, as: 'customer', attributes: ['customerName', 'customerPhone', 'shippingAddress'] },
        { model: equipmentMasterTbl, as: 'equipment', attributes: ['serialNumber', 'modelName'] }
      ]
    });
    console.log("Rental tasks fetched.");

    console.log("Fetching sales tasks...");
    const salesTasks = await salesBillingTbl.findAll({
      where: {
        deliveryStaffIdFk: userId,
        deliveryAgentCompleted: 0
      },
      include: [
        { model: customerTbl, as: 'customer', attributes: ['customerName', 'customerPhone', 'shippingAddress'] }
      ]
    });
    console.log("Sales tasks fetched.");

  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
  process.exit();
}
run();
