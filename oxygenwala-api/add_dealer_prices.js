const { sequelize } = require("./sequelize");

async function run() {
  try {
    await sequelize.query("ALTER TABLE tbl_equipment_master ADD COLUMN dealer_selling_price DECIMAL(10,2) DEFAULT 0;");
    await sequelize.query("ALTER TABLE tbl_equipment_master ADD COLUMN dealer_rental_rate_daily DECIMAL(10,2) DEFAULT 0;");
    await sequelize.query("ALTER TABLE tbl_equipment_master ADD COLUMN dealer_rental_rate_weekly DECIMAL(10,2) DEFAULT 0;");
    await sequelize.query("ALTER TABLE tbl_equipment_master ADD COLUMN dealer_rental_rate_monthly DECIMAL(10,2) DEFAULT 0;");
    console.log("Dealer columns added successfully.");
  } catch (err) {
    if (err.message.includes("Duplicate column name")) {
      console.log("Columns already exist.");
    } else {
      console.error(err);
    }
  }
  process.exit();
}
run();
