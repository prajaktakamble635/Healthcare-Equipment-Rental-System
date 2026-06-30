'use strict'
module.exports = (sequelize, DataTypes) => {
    const rentalPaymentTbl = sequelize.define(
        'tbl_rental_payment',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: "Primary Key"
            },
            agreementIdFk: {
                field: 'agreement_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            customerIdFk: {
                field: 'customer_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            installmentNo: {
                field: 'installment_no',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            dueDate: {
                field: 'due_date',
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            amountDue: {
                field: 'amount_due',
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1 - Pending, 2 - Partial, 3 - Paid'
            },
            amountPaid: {
                field: 'amount_paid',
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0
            },
            paymentDate: {
                field: 'payment_date',
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            paymentMode: {
                field: 'payment_mode',
                type: DataTypes.STRING(50),
                allowNull: true
            },
            receiptNo: {
                field: 'receipt_no',
                type: DataTypes.STRING(100),
                allowNull: true
            }
        }
    )

    rentalPaymentTbl.associate = function (models) { }
    return rentalPaymentTbl
}
