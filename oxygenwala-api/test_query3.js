const { equipmentMasterTbl, branchTbl, sequelize } = require("./sequelize");
(async () => {
  try {
    const stockData = await equipmentMasterTbl.findAll({
        where: { status: 1 },
        attributes: ['modelName', 'branchIdFk', [sequelize.fn('COUNT', sequelize.col('equipment_id_pk')), 'availableCount']],
        include: [{ model: branchTbl, as: "branch", attributes: ["name"] }],
        group: ['modelName', 'branchIdFk', sequelize.col('branch.branch_id_pk'), sequelize.col('branch.name')]
    });
    console.log(stockData.map(s => s.toJSON()));
  } catch(e) {
    console.error(e);
  }
  process.exit();
})();
