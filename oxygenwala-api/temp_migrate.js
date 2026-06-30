const { sequelize } = require('./sequelize.js');

async function run() {
  try {
    await sequelize.query(`
      ALTER TABLE tbl_rental_agreement 
      ADD COLUMN delivery_staff_id_fk INT NULL AFTER status;
    `);
    console.log("Column added successfully!");
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error adding column:", error);
    }
  }
  process.exit();
}

run();
