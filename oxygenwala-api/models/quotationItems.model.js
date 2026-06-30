'use strict'
module.exports = (sequelize, DataTypes) => {
  const quotationItemsTbl = sequelize.define(
    'tbl_quotation_items',
    {
      id: {
        field: 'quotation_items_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      quotationIdFk: {
        field: 'quotation_id_fk',
        type: DataTypes.INTEGER,
        references: {
          model: 'tbl_quotation',
          key: 'quotation_id_pk'
        }
      },

      productIdFk: {
        field: 'product_id_fk',
        type: DataTypes.INTEGER,
        references: {
          model: 'tbl_product',
          key: 'product_id_pk'
        }
      },

     

      quantity: {
        field: 'quantity',
        type: DataTypes.INTEGER,
        allowNull: false
      },

      weightPerPiece: {
        field: 'weight_per_piece',
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },

      totalWeight: {
        field: 'total_weight',
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'quantity x weight_per_piece'
      },

      ratePerKg: {
        field: 'rate_per_kg',
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },

      amount: {
        field: 'amount',
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'total_weight x rate_per_kg'
      }
    },
    {
      tableName: 'tbl_quotation_items',
      timestamps: true
    }
  )

  quotationItemsTbl.associate = function (models) {
    quotationItemsTbl.belongsTo(models.tbl_quotation, {
      foreignKey: 'quotation_id_fk'
    })
  }

  return quotationItemsTbl
}
