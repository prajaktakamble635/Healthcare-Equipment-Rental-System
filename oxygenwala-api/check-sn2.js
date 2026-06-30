const { equipmentMasterTbl } = require('./sequelize');
async function run() {
  const eq = await equipmentMasterTbl.findAll({
    where: { serialNumber: 'SN2341150' }
  });
  console.log('SN2341150:', eq.map(e => e.id));
  process.exit(0);
}
run().catch(console.error);
