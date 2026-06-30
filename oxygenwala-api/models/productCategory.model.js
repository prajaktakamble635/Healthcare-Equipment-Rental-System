'use strict'
module.exports = (sequelize, DataTypes) => {
    const productCategoryTbl = sequelize.define(
        'tbl_product_category',
        {
            id: {
                field: 'product_category_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: "primary key, auto-incremented"
            },
            categoryName: {
                field: 'category_name',
                type: DataTypes.STRING(180),
                allowNull: true
            },

            basicRate: {                     // ✅ NEW COLUMN
                field: 'basic_rate',
                type: DataTypes.DECIMAL(10, 2), // supports money values
                allowNull: true,
                comment: "Base rate for product category"
            },

            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: "1 - active, 2 - inactive"
            }
        }
    )

    productCategoryTbl.associate = function (models) { }
    return productCategoryTbl

}