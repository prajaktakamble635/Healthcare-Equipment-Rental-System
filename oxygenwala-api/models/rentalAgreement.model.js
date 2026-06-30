'use strict'
module.exports = (sequelize, DataTypes) => {
    const rentalAgreementTbl = sequelize.define(
        'tbl_rental_agreement',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: "Primary Key"
            },
            customerIdFk: {
                field: 'customer_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            equipmentIdFk: {
                field: 'equipment_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            branchIdFk: {
                field: 'branch_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            startDate: {
                field: 'start_date',
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            endDate: {
                field: 'end_date',
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            rentalRate: {
                field: 'rental_rate',
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            depositAmount: {
                field: 'deposit_amount',
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            billingCycle: {
                field: 'billing_cycle',
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: 'Daily, Weekly, Monthly, etc.'
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 4,
                comment: '1 - Active, 2 - Completed, 3 - Cancelled, 4 - Draft, 5 - Awaiting Delivery, 6 - Return Requested'
            },
            returnRequestDate: {
                field: 'return_request_date',
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            deliveryStaffIdFk: {
                field: 'delivery_staff_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true
            },
            paymentStatus: {
                field: 'payment_status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1 - Pending, 2 - Partial, 3 - Paid'
            },
            amountPaid: {
                field: 'amount_paid',
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            paymentMode: {
                field: 'payment_mode',
                type: DataTypes.STRING(50),
                allowNull: true
            }
        }
    )

    rentalAgreementTbl.associate = function (models) { }
    return rentalAgreementTbl
}
