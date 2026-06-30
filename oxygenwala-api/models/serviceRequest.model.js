'use strict'
module.exports = (sequelize, DataTypes) => {
    const serviceRequestTbl = sequelize.define(
        'tbl_service_request',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            requestNo: {
                field: 'request_no',
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
            equipmentIdFk: {
                field: 'equipment_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true
            },
            requestDate: {
                field: 'request_date',
                type: DataTypes.DATE,
                allowNull: false
            },
            issueDescription: {
                field: 'issue_description',
                type: DataTypes.TEXT,
                allowNull: false
            },
            priority: {
                field: 'priority',
                type: DataTypes.TINYINT,
                defaultValue: 2,
                comment: '1-Low, 2-Medium, 3-High'
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1-Pending, 2-In Progress, 3-Resolved, 4-Cancelled'
            },
            resolutionNotes: {
                field: 'resolution_notes',
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            tableName: 'tbl_service_request',
            timestamps: true
        }
    )

    serviceRequestTbl.associate = function (models) {
        // defined in sequelize.js
    }

    return serviceRequestTbl
}
