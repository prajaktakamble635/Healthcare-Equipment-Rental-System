'use strict';
module.exports = (sequelize, DataTypes) => {
  const branchTbl = sequelize.define(
    'tbl_branch',
    {
      id: {
        field: 'branch_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'primary key, auto-incremented',
      },
      name: {
        field: 'name',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      address: {
        field: 'address',
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contactDetails: {
        field: 'contact_details',
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        field: 'status',
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '1 - active, 2 - inactive, 3 - deleted',
      },
    },
    {
      tableName: 'tbl_branch',
      timestamps: true,
    }
  );

  return branchTbl;
};
