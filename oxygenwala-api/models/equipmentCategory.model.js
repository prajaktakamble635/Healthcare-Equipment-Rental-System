'use strict';
module.exports = (sequelize, DataTypes) => {
  const equipmentCategoryTbl = sequelize.define(
    'tbl_equipment_category',
    {
      id: {
        field: 'equipment_category_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'primary key, auto-incremented',
      },
      categoryName: {
        field: 'category_name',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        field: 'status',
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '1 - active, 2 - inactive, 3 - deleted',
      },
    },
    {
      tableName: 'tbl_equipment_category',
      timestamps: true,
    }
  );

  return equipmentCategoryTbl;
};
