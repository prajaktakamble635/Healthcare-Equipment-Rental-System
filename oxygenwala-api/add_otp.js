const { sequelize } = require("./sequelize");

async function run() {
  try {
    await sequelize.query("ALTER TABLE tbl_sales_billing ADD COLUMN delivery_otp VARCHAR(10) NULL;");
    console.log("OTP Column added successfully.");
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
