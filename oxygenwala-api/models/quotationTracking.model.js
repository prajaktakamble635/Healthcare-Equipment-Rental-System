'use strict'
module.exports = (sequelize, DataTypes) => {
    const quotationTrackingTbl = sequelize.define(
        'tbl_quotation_tracking',
        {
            id:{
                field:'quotation_tracking_id_pk',
                type:DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: 'primary key, auto-incremented'
            },
            quotationIdFk:{
                field:'quotation_id_fk',
                type:DataTypes.INTEGER,
                allowNull:true,
                references:{
                    model:'tbl_quotation',
                    key: 'quotation_id_pk'
                }
            },
            quotationStatus:{
                field:'quotation_status',
                type:DataTypes.TINYINT,
                defaultValue: 1,
                comment:"1-Draft, 2-Sent, 3-Approved, 4-Rejected"
            },
            status:{
                field:'status',
                type:DataTypes.TINYINT,
                defaultValue:1,
                comment:"1 - active, 2 - inactive"
            },
            remark:{
                field:'remark',
                type:DataTypes.TEXT,
                allowNull:true 
            },
            userIdFk:{
                field:'user_id_fk',
                type:DataTypes.INTEGER,
                allowNull:true,
                references:{
                    model:'tbl_user',
                    key:'user_id_pk'
                }
            }
        }
    )

    quotationTrackingTbl.associate = function(models){}
    return quotationTrackingTbl
}