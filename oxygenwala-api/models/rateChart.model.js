'use strict'
module.exports = (sequelize, DataTypes) => {
    const rateChartTbl = sequelize.define(
        'tbl_rate_chart',
        {
            id:{
                field:'rate_chart_id_pk',
                type:DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement:true,
                comment:"primary key, auto-increment"
            },
            productIdFk:{
                field:'product_id_fk',
                type:DataTypes.INTEGER,
                allowNull:true,
                references:{
                    model:'tbl_product',
                    key:'product_id_pk'
                }
            },
            rate:{
                field:'rate',
                type:DataTypes.DECIMAL(10, 2),
                defaultValue: null,
                allowNull:true 
            },
            effectiveDate:{
                field:'effective_date',
                type:DataTypes.DATE,
                allowNull:true 
            },
            status:{
                field:'status',
                type:DataTypes.TINYINT,
                defaultValue:1,
                comment:'1 - active, 2 - inactive'
            }
        }
    )

    rateChartTbl.associate = function(models){}
    return rateChartTbl

}