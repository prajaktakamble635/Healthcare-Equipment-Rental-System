const db = require('./sequelize');

async function updateSchema() {
  try {
    const queryInterface = db.sequelize.getQueryInterface();

    // Check if pan_number column exists in tbl_customer
    const customerTableDesc = await queryInterface.describeTable('tbl_customer');
    
    if (!customerTableDesc.pan_number) {
      const { DataTypes } = require('sequelize');
      await queryInterface.addColumn('tbl_customer', 'pan_number', {
        type: DataTypes.STRING(20),
        allowNull: true, // Initially allow null for existing records
      });
      console.log('Successfully added pan_number column to tbl_customer.');
    } else {
      console.log('Column pan_number already exists in tbl_customer.');
    }

    // Since we are making aadhaar_number NOT NULL, let's just make sure we don't crash on existing NULLs.
    // The application logic will enforce NOT NULL moving forward.
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    process.exit(0);
  }
}

updateSchema();
