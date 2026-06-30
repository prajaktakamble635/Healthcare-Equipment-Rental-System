const { sequelize } = require("./sequelize");

async function run() {
  try {
    await sequelize.query("ALTER TABLE tbl_rental_agreements ADD COLUMN return_request_date DATE NULL;");
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
