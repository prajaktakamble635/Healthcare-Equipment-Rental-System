const { equipmentMasterTbl, sequelize } = require('./sequelize');
async function run() {
  const equipments = await equipmentMasterTbl.findAll({
    order: [['id', 'ASC']]
  });
  
  const snCounts = {};
  const toUpdate = [];

  for (const eq of equipments) {
    const sn = eq.serialNumber;
    if (!snCounts[sn]) {
      snCounts[sn] = 1;
    } else {
      snCounts[sn]++;
      toUpdate.push({
        id: eq.id,
        oldSn: sn,
        newSn: `${sn}-${snCounts[sn]}`
      });
    }
  }

  console.log(`Found ${toUpdate.length} duplicate equipments to rename.`);
  
  // Actually update them
  for (const item of toUpdate) {
    await equipmentMasterTbl.update(
      { serialNumber: item.newSn },
      { where: { id: item.id } }
    );
    console.log(`Updated ID ${item.id}: ${item.oldSn} -> ${item.newSn}`);
  }
  
  console.log('Done fixing duplicates!');
  process.exit(0);
}
run().catch(console.error);
