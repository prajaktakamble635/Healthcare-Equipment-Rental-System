'use strict'
module.exports = (sequelize, DataTypes) => {
    const customerTbl = sequelize.define(
        'tbl_customer',
        {
            id: {
                field: 'customer_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: "primary key, auto-incremented"
            },
            customerName: {
                field: 'customer_name',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            customerPhone: {
                field: 'customer_phone',
                type: DataTypes.STRING(18),
                allowNull: true
            },
            alternateNumber: {
                field: 'alternate_no',
                type: DataTypes.STRING(18),
                allowNull: true
            },
            customerEmail: {
                field: 'customer_email',
                type: DataTypes.STRING(180),
                allowNull: true
            },
            address: {
                field: 'address',
                type: DataTypes.TEXT,
                allowNull: true
            },
            billingAddress: {
                field: 'billing_address',
                type: DataTypes.TEXT,
                allowNull: true
            },

            shippingAddress: {
                field: 'shipping_address',
                type: DataTypes.TEXT,
                allowNull: true
            },
            category: {
                field: 'category',
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 3,
                comment: '1 - Hospital, 2 - Clinic, 3 - Individual, 4 - Dealer'
            },
            branchIdFk: {
                field: 'branch_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            aadhaarNumber: {
                field: 'aadhaar_number',
                type: DataTypes.STRING(20),
                allowNull: false
            },
            panNumber: {
                field: 'pan_number',
                type: DataTypes.STRING(20),
                allowNull: false
            },
            gstNumber: {
                field: 'gst_number',
                type: DataTypes.STRING(20),
                allowNull: true
            },
            documents: {
                field: 'documents',
                type: DataTypes.JSON,
                allowNull: true,
                comment: 'Stores paths for uploaded ID proof, agreements, etc.'
            },

            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1 - active, 2 - inactive'
            }
        }
    )

    customerTbl.associate = function (models) { }
    return customerTbl

}