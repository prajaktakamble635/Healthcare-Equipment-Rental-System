const { equipmentMasterTbl } = require('./sequelize');
async function run() {
  const eq = await equipmentMasterTbl.findAll({
    where: { serialNumber: 'SN6620734' }
  });
  console.log('SN6620734:', eq.map(e => e.id));

  const eq2 = await equipmentMasterTbl.findAll({
    where: { serialNumber: 'SN6620731' }
  });
  console.log('SN6620731:', eq2.map(e => e.id));

  process.exit(0);
}
run().catch(console.error);
