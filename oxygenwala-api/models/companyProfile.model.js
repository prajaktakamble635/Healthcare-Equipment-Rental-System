'use strict'
module.exports = (sequelize, DataTypes) => {
    const companyProfileTbl = sequelize.define(
        'tbl_company_profile',
        {
            id: {
                field: 'company_profile_id_pk',
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: "primary key, auto-incremented"
            },
            companyName: {
                field: 'company_name',
                type: DataTypes.STRING(180),
                allowNull: true
            },
            logoUrl: {
                field: 'logo_url',
                type: DataTypes.STRING(80),
                allowNull: true
            },
            address: {
                field: 'address',
                type: DataTypes.TEXT,
                allowNull: true
            },
            phone: {
                field: 'phone',
                type: DataTypes.STRING(15),
                allowNull: true
            },
            email: {
                field: 'email',
                type: DataTypes.STRING(180),
                allowNull: true
            },
            website: {
                field: 'website',
                type: DataTypes.TEXT,
                allowNull: true
            },
            gstNo: {
                field: 'gst_no',
                type: DataTypes.STRING(180),
                allowNull: true
            },
            panNo: {
                field: 'pan_no',
                type: DataTypes.STRING(80),
                allowNull: true
            },
            bankName: {
                field: 'bank_name',
                type: DataTypes.STRING(180),
                allowNull: true
            },

            accountHolderName: {
                field: 'account_holder_name',
                type: DataTypes.STRING(180),
                allowNull: true
            },

            accountNo: {
                field: 'account_no',
                type: DataTypes.STRING(50),
                allowNull: true
            },

            ifscCode: {
                field: 'ifsc_code',
                type: DataTypes.STRING(20),
                allowNull: true
            },

            branchName: {
                field: 'branch_name',
                type: DataTypes.STRING(180),
                allowNull: true
            }

        }
    )

    companyProfileTbl.associate = function (models) { }
    return companyProfileTbl

}