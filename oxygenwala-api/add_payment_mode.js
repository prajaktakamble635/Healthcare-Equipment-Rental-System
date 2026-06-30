const { sequelize } = require("./sequelize");

async function run() {
  try {
    await sequelize.query("ALTER TABLE tbl_rental_agreement ADD COLUMN payment_mode VARCHAR(50) NULL AFTER amount_paid;");
    console.log("Column added successfully.");
  } catch (err) {
    if (err.message.includes("Duplicate column name")) {
      console.log("Column already exists.");
    } else {
      console.error(err);
    }
  }
  process.exit();
}
run();
