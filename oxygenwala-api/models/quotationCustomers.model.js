'use strict'
module.exports = (sequelize, DataTypes) => {
    const quotationCustomersTbl = sequelize.define(
        'tbl_quotation_customers',
        {
            id:{
                field:'quotation_id_pk',
                type:DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment:"primary key, auto-incremented"
            },
            quotationIdFk:{
                field:'quotation_id_fk',
                type:DataTypes.INTEGER,
                allowNull:true,
                references:{
                    model:'tbl_quotation',
                    key:'quotation_id_pk'
                }
            },
            customerName:{
                field:'customer_name',
                type:DataTypes.STRING(255),
                allowNull:true 
            },
            address:{
                field:'address',
                type:DataTypes.TEXT,
                allowNull:true 
            },
            phone:{
                field:'phone',
                type:DataTypes.STRING(18),
                allowNull:true 
            },
            email:{
                field:'email',
                type:DataTypes.STRING(180),
                allowNull:true 
            }
        }
    )

    quotationCustomersTbl.associate = function(models){}
    return quotationCustomersTbl

}