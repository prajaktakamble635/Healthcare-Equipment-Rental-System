const { salesBillingTbl, branchTbl, sequelize } = require("./sequelize");
(async () => {
  try {
    const salesData = await salesBillingTbl.findAll({
        attributes: [
            'branchIdFk',
            [sequelize.fn('SUM', sequelize.col('grand_total')), 'totalSales'],
            [sequelize.fn('COUNT', sequelize.col('tbl_sales_billing.id')), 'invoiceCount']
        ],
        include: [{ model: branchTbl, as: "branch", attributes: ["name"] }],
        group: ['branchIdFk', sequelize.col('branch.branch_id_pk'), sequelize.col('branch.name')]
    });
    console.log(salesData.map(s => s.toJSON()));
  } catch(e) {
    console.error(e);
  }
  process.exit();
})();
