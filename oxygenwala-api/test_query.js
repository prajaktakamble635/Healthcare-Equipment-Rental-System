const { equipmentMasterTbl, sequelize } = require("./sequelize");
(async () => {
  try {
    const utilData = await equipmentMasterTbl.findAll({
        where: { branchIdFk: 1 },
        attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('equipment_id_pk')), 'count']
        ],
        group: ['status']
    });
    console.log(utilData.map(u => u.toJSON()));
  } catch(e) {
    console.error(e);
  }
  process.exit();
})();
