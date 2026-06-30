'use strict'
module.exports = (sequelize, DataTypes) => {
  const quotationTbl = sequelize.define(
    'tbl_quotation',
    {
      id: {
        field: 'quotation_id_pk',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      quotationNo: {
        field: 'quotation_no',
        type: DataTypes.STRING(180),
        allowNull: true,
        comment: 'OTN-YYYYMM-XXXX'
      },

      customerIdFk: {
        field: 'customer_id_fk',
        type: DataTypes.INTEGER,
        references: {
          model: 'tbl_customer',
          key: 'customer_id_pk'
        }
      },

      userIdFk: {
        field: 'user_id_fk',
        type: DataTypes.INTEGER,
        references: {
          model: 'tbl_user',
          key: 'user_id_pk'
        }
      },

      quotationDate: {
        field: 'quotation_date',
        type: DataTypes.DATE
      },

      validTill: {
        field: 'valid_till',
        type: DataTypes.DATE
      },

      quotationStatus: {
        field: 'quotation_status',
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '1-Draft, 2-Sent, 3-Approved, 4-Rejected'
      },

      /* ===== AMOUNTS ===== */

      subTotal: {
        field: 'sub_total',
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
      },
      loadingWeight: {
        field: 'loading_weight',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.35,
        comment: ' total weight in KG for loading charges'
      },
      loadingRate: {
        field: 'loading_rate',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.35,
        comment: '₹ per KG (fixed)'
      },

      loadingAmount: {
        field: 'loading_amount',
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
      },

      shippingCharge: {
        field: 'shipping_charge',
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
      },

      taxPercentage: {
        field: 'tax_percentage',
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 18
      },

      taxAmount: {
        field: 'tax_amount',
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
      },

      roundingAdjustment: {
        field: 'rounding_adjustment',
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },

      grandTotal: {
        field: 'grand_total',
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
      },

      termsAndConditions: {
        field: 'terms_and_conditions',
        type: DataTypes.TEXT,
        allowNull: true
      },

      pdfUrl: {
        field: 'pdf_url',
        type: DataTypes.TEXT,
        allowNull: true
      },

      status: {
        field: 'status',
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '1-Active, 2-Inactive'
      }
    },
    {
      tableName: 'tbl_quotation',
      timestamps: true
    }
  )

  quotationTbl.associate = function (models) {
    quotationTbl.hasMany(models.tbl_quotation_items, {
      foreignKey: 'quotation_id_fk'
    })
  }

  return quotationTbl
}
