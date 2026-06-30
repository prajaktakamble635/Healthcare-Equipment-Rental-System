'use strict'
module.exports = (sequelize, DataTypes) => {
    const productTbl = sequelize.define(
        'tbl_product',
        {
            id: {
                field: 'product_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: "primary key, auto-incremented"
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
            productName: {
                field: 'product_name',
                type: DataTypes.STRING(180),
                allowNull: true,
                comment: "Ex: SQ9, 25x25, 58OD, etc."
            },
            diffrence: {
                field: 'diffrence',
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            curruntRate: {
                field: 'currunt_rate',
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            weightPerPiece: {
                field: "weight_per_piece",
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            description: {
                field: 'description',
                type: DataTypes.TEXT,
                allowNull: true
            },
            unit: {
                field: 'unit',
                type: DataTypes.STRING(180),
                allowNull: true,
                comment: "Kg , Piece, etc"
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: "1 - active, 2 - inactive"
            },



            // ⭐ NEW FIELD 2 — Size (required only when attributeType = thickness)
            type: {
                field: 'type',
                type: DataTypes.STRING(20),
                allowNull: true,
                comment: "thickness, rate"
            },
            thicknessMM: {
                field: 'thickness_mm',
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            gauge: {
                field: 'gauge',
                type: DataTypes.STRING(50),
                allowNull: true
            },

        }
    )

    productTbl.associate = function (models) { }
    return productTbl

}
