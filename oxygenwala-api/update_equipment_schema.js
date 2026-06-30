const db = require('./sequelize');

async function updateSchema() {
  try {
    const queryInterface = db.sequelize.getQueryInterface();
    const { DataTypes } = require('sequelize');

    const equipmentTableDesc = await queryInterface.describeTable('tbl_equipment_master');
    
    if (!equipmentTableDesc.purchase_rate) {
      await queryInterface.addColumn('tbl_equipment_master', 'purchase_rate', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      });
      console.log('Successfully added purchase_rate column to tbl_equipment_master.');
    } else {
      console.log('Column purchase_rate already exists.');
    }

    if (!equipmentTableDesc.warranty_start_date) {
      await queryInterface.addColumn('tbl_equipment_master', 'warranty_start_date', {
        type: DataTypes.DATEONLY,
        allowNull: true,
      });
      console.log('Successfully added warranty_start_date column to tbl_equipment_master.');
    } else {
      console.log('Column warranty_start_date already exists.');
    }

    if (!equipmentTableDesc.warranty_end_date) {
      await queryInterface.addColumn('tbl_equipment_master', 'warranty_end_date', {
        type: DataTypes.DATEONLY,
        allowNull: true,
      });
      console.log('Successfully added warranty_end_date column to tbl_equipment_master.');
    } else {
      console.log('Column warranty_end_date already exists.');
    }

  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    process.exit(0);
  }
}

updateSchema();
