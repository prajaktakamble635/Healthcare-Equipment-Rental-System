'use strict'
module.exports = (sequelize, DataTypes) => {
    const familyMemberTbl = sequelize.define(
        'tbl_family_member',
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
            name: {
                field: 'name',
                type: DataTypes.STRING(255),
                allowNull: false
            },
            age: {
                field: 'age',
                type: DataTypes.INTEGER,
                allowNull: true
            },
            relation: {
                field: 'relation',
                type: DataTypes.STRING(100),
                allowNull: true
            },
            aadhaarNumber: {
                field: 'aadhaar_number',
                type: DataTypes.STRING(20),
                allowNull: true
            },
            panNumber: {
                field: 'pan_number',
                type: DataTypes.STRING(20),
                allowNull: true
            },
            otherDetails: {
                field: 'other_details',
                type: DataTypes.TEXT,
                allowNull: true
            },
            status: {
                field: 'status',
                type: DataTypes.TINYINT,
                defaultValue: 1,
                comment: '1 - Active, 2 - Inactive'
            }
        }
    )

    familyMemberTbl.associate = function (models) { }
    return familyMemberTbl
}
