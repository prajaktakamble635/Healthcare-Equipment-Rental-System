'use strict'
module.exports = (sequelize, DataTypes) => {
    const rateChangeLogTbl = sequelize.define(
        'tbl_rate_change_log',
        {
            id:{
                field:'rate_change_log_id_pk',
                type:DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment:'primary key, auto-incremented'
            },
            rateChartIdFk:{
                field:'rate_chart_id_fk',
                type:DataTypes.INTEGER,
                allowNull:true,
                references:{
                    model:'tbl_rate_chart',
                    key:'rate_chart_id_pk'
                }
            },
            oldRate:{
                field:'old_rate',
                type:DataTypes.DECIMAL(10, 2),
                defaultValue: null,
                allowNull:true 
            },
            newRate:{
                field:'new_rate',
                type:DataTypes.DECIMAL(10, 2),
                allowNull:true,
                defaultValue: null 
            },
            differencePercentage:{
                field:'difference_percentage',
                type:DataTypes.DECIMAL(10, 2),
                allowNull:true,
                defaultValue: null 
            },
            status:{
                field:'status',
                type:DataTypes.TINYINT,
                defaultValue: 1,
                comment:'1 - active, 2 - inactive' 
            }
        }
    )

    rateChangeLogTbl.associate = function(models){}
    return rateChangeLogTbl

}