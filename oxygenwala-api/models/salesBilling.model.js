'use strict'
module.exports = (sequelize, DataTypes) => {
    const salesBillingTbl = sequelize.define(
        'tbl_sales_billing',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            invoiceNo: {
                field: 'invoice_no',
                type: DataTypes.STRING(100),
                allowNull: true
            },
            customerIdFk: {
                field: 'customer_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            branchIdFk: {
                field: 'branch_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            billingDate: {
                field: 'billing_date',
                type: DataTypes.DATE,
                allowNull: false
            },
            subTotal: {
                field: 'sub_total',
                type: DataTypes.DECIMAL(12, 2),
                defaultValue: 0
            },
            taxAmount: {
                field: 'tax_amount',
                type: DataTypes.DECIMAL(12, 2),
                defaultValue: 0
            },
            grandTotal: {
                field: 'grand_total',
                type: DataTypes.DECIMAL(12, 2),
                defaultValue: 0
            },
            paymentStatus: {
                field: 'payment_status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1 - Pending, 2 - Partial, 3 - Paid'
            },
            paymentMode: {
                field: 'payment_mode',
                type: DataTypes.STRING(50),
                allowNull: true
            },
            deliveryStaffIdFk: {
                field: 'delivery_staff_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true
            },
            deliveryAgentCompleted: {
                field: 'delivery_agent_completed',
                type: DataTypes.TINYINT,
                defaultValue: 0
            },
            customerCompleted: {
                field: 'customer_completed',
                type: DataTypes.TINYINT,
                defaultValue: 0
            },
            deliveryOtp: {
                field: 'delivery_otp',
                type: DataTypes.STRING(10),
                allowNull: true
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1-Active, 2-Cancelled'
            }
        },
        {
            tableName: 'tbl_sales_billing',
            timestamps: true
        }
    )

    salesBillingTbl.associate = function (models) {
        // associations will be defined in sequelize.js
    }

    return salesBillingTbl
}
