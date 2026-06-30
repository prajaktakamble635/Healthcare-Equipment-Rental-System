// models/productRateHistoryTbl.js
'use strict'
module.exports = (sequelize, DataTypes) => {
  const productRateHistoryTbl = sequelize.define(
    'tbl_product_rate_history',
    {
      id: {
        field: 'rate_history_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      productIdFk: {
        field: 'product_id_fk',
        type: DataTypes.INTEGER,
        allowNull: false
      },

      productCategoryIdFk: {
        field: 'product_category_id_fk',
        type: DataTypes.INTEGER,
        allowNull: true
      },

      oldBasicRate: {
        field: 'old_basic_rate',
        type: DataTypes.DECIMAL(10, 2)
      },

      newBasicRate: {
        field: 'new_basic_rate',
        type: DataTypes.DECIMAL(10, 2)
      },

      difference: {
        field: 'difference',
        type: DataTypes.DECIMAL(10, 2)
      },

      oldCurrentRate: {
        field: 'old_current_rate',
        type: DataTypes.DECIMAL(10, 2)
      },

      newCurrentRate: {
        field: 'new_current_rate',
        type: DataTypes.DECIMAL(10, 2)
      },

      changedAt: {
        field: 'changed_at',
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    }
  )

  return productRateHistoryTbl
}
