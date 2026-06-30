const { equipmentMasterTbl, sequelize } = require('./sequelize');
async function run() {
  const eq = await equipmentMasterTbl.findOne();
  console.log(JSON.stringify(eq.toJSON(), null, 2));
  process.exit(0);
}
run().catch(console.error);
