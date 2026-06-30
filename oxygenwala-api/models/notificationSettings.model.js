'use strict'
module.exports = (sequelize, DataTypes) => {
    const notificationSettingsTbl = sequelize.define(
        'tbl_notification_settings',
        {
            id: {
                field: 'id',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            branchIdFk: {
                field: 'branch_id_fk',
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Null means global settings'
            },
            rentalDueAlertDays: {
                field: 'rental_due_alert_days',
                type: DataTypes.INTEGER,
                defaultValue: 2
            },
            rentalDueEmailStatus: {
                field: 'rental_due_email_status',
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            rentalDueSmsStatus: {
                field: 'rental_due_sms_status',
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            maintenanceAlertDays: {
                field: 'maintenance_alert_days',
                type: DataTypes.INTEGER,
                defaultValue: 5
            },
            lowStockThreshold: {
                field: 'low_stock_threshold',
                type: DataTypes.INTEGER,
                defaultValue: 3
            },
            paymentDueAlertDays: {
                field: 'payment_due_alert_days',
                type: DataTypes.INTEGER,
                defaultValue: 3
            },
            smsGatewayUrl: {
                field: 'sms_gateway_url',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            smsApiKey: {
                field: 'sms_api_key',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            emailSmtpHost: {
                field: 'email_smtp_host',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            emailSmtpPort: {
                field: 'email_smtp_port',
                type: DataTypes.STRING(10),
                allowNull: true
            },
            emailSmtpUser: {
                field: 'email_smtp_user',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            emailSmtpPass: {
                field: 'email_smtp_pass',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            paymentGatewayKey: {
                field: 'payment_gateway_key',
                type: DataTypes.STRING(255),
                allowNull: true
            },
            paymentGatewaySecret: {
                field: 'payment_gateway_secret',
                type: DataTypes.STRING(255),
                allowNull: true
            }
        },
        {
            tableName: 'tbl_notification_settings',
            timestamps: true
        }
    )

    notificationSettingsTbl.associate = function (models) { }

    return notificationSettingsTbl
}
