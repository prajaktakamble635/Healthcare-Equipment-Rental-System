const { sequelize } = require("./oxygenwala-api/sequelize.js");

async function migrate() {
  try {
    try { await sequelize.query("ALTER TABLE tbl_equipment_master DROP COLUMN warranty_start_date;"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE tbl_equipment_master DROP COLUMN warranty_end_date;"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE tbl_equipment_master ADD COLUMN warranty_period VARCHAR(100) NULL AFTER purchase_rate;"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE tbl_equipment_master ADD COLUMN images JSON NULL AFTER warranty_details;"); } catch (e) { console.log(e.message); }
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
}

migrate();
