"use strict";
module.exports = (sequelize, DataTypes) => {
  const basicRateTbl = sequelize.define(
    "tbl_product_basic_rate",
    {
      id: {
        field: "basic_rate_id_pk",
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      productCategoryIdFk: {
        field: "product_category_id_fk",
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_product_category",
          key: "product_category_id_pk"
        }
      },

      rateType: {
        field: "rate_type",
        type: DataTypes.ENUM("rate", "thickness"),
        allowNull: false,
        comment: "rate = direct rate, thickness = gauge-based rate"
      },

      // ⭐ GAUGE NOW OPTIONAL
      gauge: {
        field: "gauge",
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Required only if rateType = thickness"
      },


      basicRate: {
        field: "basic_rate",
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      difference: {
        field: "difference",
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },

      effectiveDate: {
        field: "effective_date",
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
      },

      status: {
        field: "status",
        type: DataTypes.TINYINT,
        defaultValue: 1  // 1-active, 2-inactive
      }
    }
  );

  return basicRateTbl;
};
