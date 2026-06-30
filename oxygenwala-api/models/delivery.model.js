'use strict'
module.exports = (sequelize, DataTypes) => {
    const deliveryTbl = sequelize.define(
        'tbl_delivery',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: "Primary Key"
            },
            deliveryNo: {
                field: 'delivery_no',
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true
            },
            agreementIdFk: {
                field: 'agreement_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "Foreign Key to tbl_rental_agreement"
            },
            customerIdFk: {
                field: 'customer_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            employeeIdFk: {
                field: 'employee_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "Delivery assigned to this employee"
            },
            deliveryDate: {
                field: 'delivery_date',
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            deliveryTime: {
                field: 'delivery_time',
                type: DataTypes.TIME,
                allowNull: true
            },
            equipmentIdFk: {
                field: 'equipment_id_fk',
                type: DataTypes.INTEGER,
                allowNull: false
            },
            serialNumber: {
                field: 'serial_number',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            photoBeforeDelivery: {
                field: 'photo_before_delivery',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            customerSignature: {
                field: 'customer_signature',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            employeeSignature: {
                field: 'employee_signature',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            otpVerified: {
                field: 'otp_verified',
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            remarks: {
                field: 'remarks',
                type: DataTypes.TEXT,
                allowNull: true
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1 - Pending, 2 - Assigned, 3 - Out For Delivery, 4 - Delivered'
            }
        }
    )

    deliveryTbl.associate = function (models) { }
    return deliveryTbl
}
