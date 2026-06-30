'use strict'
module.exports = (sequelize, DataTypes) => {
    const salesBillingItemsTbl = sequelize.define(
        'tbl_sales_billing_items',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            salesBillingIdFk: {
                field: 'sales_billing_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            equipmentIdFk: {
                field: 'equipment_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true
            },
            itemName: {
                field: 'item_name',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            quantity: {
                field: 'quantity',
                type: DataTypes.INTEGER,
                defaultValue: 1
            },
            unitPrice: {
                field: 'unit_price',
                type: DataTypes.DECIMAL(12, 2),
                defaultValue: 0
            },
            totalPrice: {
                field: 'total_price',
                type: DataTypes.DECIMAL(12, 2),
                defaultValue: 0
            }
        },
        {
            tableName: 'tbl_sales_billing_items',
            timestamps: true
        }
    )

    salesBillingItemsTbl.associate = function (models) {
        // associations will be defined in sequelize.js
    }

    return salesBillingItemsTbl
}
