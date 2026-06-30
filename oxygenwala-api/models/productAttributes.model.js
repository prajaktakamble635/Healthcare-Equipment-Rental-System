'use strict'
module.exports = (sequelize, DataTypes) => {
    const productAttributeTbl = sequelize.define(
        'tbl_product_attribute',
        {
            id:{
                field:'product_attribute_id_pk',
                type:DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement:true,
                comment:"primary key, auto-incremented"
            },
            productIdFk:{
                field:'product_id_fk',
                type:DataTypes.INTEGER,
                allowNull:true,
                references:{
                    model:'tbl_product',
                    key:"product_id_pk"
                }
            },
            attributeName:{
                field:'attribute_name',
                type:DataTypes.STRING(180),
                allowNull:true,
                comment:"1.0mm, 1.2mm, 2mm-3mm"
            },
            status:{
                field:'status',
                type:DataTypes.TINYINT,
                defaultValue:1,
                comment:"1 - active, 2 - inactive" 
            }
        }
    )

    productAttributeTbl.associate = function(models){}
    return productAttributeTbl

}