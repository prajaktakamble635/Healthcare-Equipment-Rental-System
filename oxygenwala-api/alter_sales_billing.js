const { sequelize } = require("./sequelize");

async function run() {
  try {
    await sequelize.query("ALTER TABLE tbl_sales_billing ADD COLUMN delivery_staff_id_fk INT NULL AFTER payment_mode;");
    await sequelize.query("ALTER TABLE tbl_sales_billing ADD COLUMN delivery_agent_completed TINYINT(1) DEFAULT 0 AFTER delivery_staff_id_fk;");
    await sequelize.query("ALTER TABLE tbl_sales_billing ADD COLUMN customer_completed TINYINT(1) DEFAULT 0 AFTER delivery_agent_completed;");
    console.log("Columns added successfully.");
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
}
run();
