'use strict'
module.exports = (sequelize, DataTypes) => {
    const maintenanceTbl = sequelize.define(
        'tbl_maintenance',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            maintenanceNo: {
                field: 'maintenance_no',
                type: DataTypes.STRING(100),
                allowNull: true
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
            maintenanceType: {
                field: 'maintenance_type',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1-Preventive/AMC, 2-Corrective/Repair'
            },
            scheduledDate: {
                field: 'scheduled_date',
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            completedDate: {
                field: 'completed_date',
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            cost: {
                field: 'cost',
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            serviceProvider: {
                field: 'service_provider',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1-Scheduled, 2-In Progress, 3-Completed, 4-Cancelled'
            },
            notes: {
                field: 'notes',
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            tableName: 'tbl_maintenance',
            timestamps: true
        }
    )

    maintenanceTbl.associate = function (models) {
        // defined in sequelize.js
    }

    return maintenanceTbl
}
