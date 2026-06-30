'use strict';
module.exports = (sequelize, DataTypes) => {
  const equipmentMasterTbl = sequelize.define(
    'tbl_equipment_master',
    {
      id: {
        field: 'equipment_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'primary key, auto-incremented',
      },
      equipmentCategoryIdFk: {
        field: 'equipment_category_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_equipment_category',
          key: 'equipment_category_id_pk',
        },
      },
      branchIdFk: {
        field: 'branch_id_fk',
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_branch',
          key: 'branch_id_pk',
        },
      },
      modelName: {
        field: 'model_name',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      serialNumber: {
        field: 'serial_number',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      purchaseDate: {
        field: 'purchase_date',
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      purchaseRate: {
        field: 'purchase_rate',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      warrantyPeriod: {
        field: 'warranty_period',
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      images: {
        field: 'images',
        type: DataTypes.JSON,
        allowNull: true,
      },
      warrantyDetails: {
        field: 'warranty_details',
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rentalRateDaily: {
        field: 'rental_rate_daily',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      rentalRateWeekly: {
        field: 'rental_rate_weekly',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      rentalRateMonthly: {
        field: 'rental_rate_monthly',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sellingPrice: {
        field: 'selling_price',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      dealerRentalRateDaily: {
        field: 'dealer_rental_rate_daily',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      dealerRentalRateWeekly: {
        field: 'dealer_rental_rate_weekly',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      dealerRentalRateMonthly: {
        field: 'dealer_rental_rate_monthly',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      dealerSellingPrice: {
        field: 'dealer_selling_price',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      maintenanceSchedule: {
        field: 'maintenance_schedule',
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        field: 'status',
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '1 - Available, 2 - Rented, 3 - Under Maintenance, 4 - Sold, 5 - Inactive',
      },
      isRentalOnly: {
        field: 'is_rental_only',
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'If true, this equipment is only available for rental services',
      },
      gst: {
        field: 'gst',
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'GST Percentage',
      },
    },
    {
      tableName: 'tbl_equipment_master',
      timestamps: true,
    }
  );

  return equipmentMasterTbl;
};
