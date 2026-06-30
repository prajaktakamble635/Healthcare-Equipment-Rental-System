'use strict';
module.exports = (sequelize, DataTypes) => {
  const stockTransferTbl = sequelize.define(
    'tbl_stock_transfer',
    {
      id: {
        field: 'stock_transfer_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'primary key, auto-incremented',
      },
      equipmentIdFk: {
        field: 'equipment_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_equipment_master',
          key: 'equipment_id_pk',
        },
      },
      fromBranchIdFk: {
        field: 'from_branch_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_branch',
          key: 'branch_id_pk',
        },
      },
      toBranchIdFk: {
        field: 'to_branch_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_branch',
          key: 'branch_id_pk',
        },
      },
      transferDate: {
        field: 'transfer_date',
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      remarks: {
        field: 'remarks',
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imagePath: {
        field: 'image_path',
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      transferredByIdFk: {
        field: 'transferred_by_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_user',
          key: 'user_id_pk',
        },
      },
      status: {
        field: 'status',
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '1 - Pending, 2 - Approved, 3 - Completed, 4 - Rejected, 5 - Deleted',
      },
    },
    {
      tableName: 'tbl_stock_transfer',
      timestamps: true,
    }
  );

  return stockTransferTbl;
};
