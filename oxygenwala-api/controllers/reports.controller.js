const {
    rentalAgreementTbl,
    equipmentMasterTbl,
    salesBillingTbl,
    customerTbl,
    branchTbl,
    maintenanceTbl,
    sequelize
} = require("../sequelize");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

const getReports = async (req, res) => {
    try {
        const { reportType, branchIdFk } = req.query;
        let data = [];

        // Apply branch filter if subadmin
        let branchFilter = {};
        if (req.userRole !== 1 && req.branchIdFk) {
            branchFilter.branchIdFk = req.branchIdFk;
        } else if (branchIdFk) {
            branchFilter.branchIdFk = branchIdFk;
        }

        switch (reportType) {
            case "daily_rental":
                // Daily Rental Report: Rentals created today or active today
                const todayStart = dayjs().startOf('day').toDate();
                const todayEnd = dayjs().endOf('day').toDate();
                data = await rentalAgreementTbl.findAll({
                    where: {
                        ...branchFilter,
                        createdAt: { [Op.between]: [todayStart, todayEnd] }
                    },
                    include: [
                        { model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] },
                        { model: branchTbl, as: "branch", attributes: ["name"] }
                    ]
                });
                break;

            case "equipment_utilization":
                // Equipment Utilization: Count by status
                const utilData = await equipmentMasterTbl.findAll({
                    where: branchFilter,
                    attributes: [
                        'status',
                        [sequelize.fn('COUNT', sequelize.col('equipment_id_pk')), 'count']
                    ],
                    group: ['status']
                });
                // Transform into simple object mapping
                data = utilData.map(u => ({
                    status: u.status,
                    label: u.status === 1 ? "Available" : u.status === 2 ? "Rented" : u.status === 3 ? "Sold" : "Maintenance",
                    count: parseInt(u.get('count'))
                }));
                break;

            case "branch_sales":
                // Branch-wise Sales
                const salesData = await salesBillingTbl.findAll({
                    where: branchFilter,
                    attributes: [
                        'branchIdFk',
                        [sequelize.fn('SUM', sequelize.col('grand_total')), 'totalSales'],
                        [sequelize.fn('COUNT', sequelize.col('tbl_sales_billing.id')), 'invoiceCount']
                    ],
                    include: [{ model: branchTbl, as: "branch", attributes: ["name"] }],
                    group: ['branchIdFk', sequelize.col('branch.branch_id_pk'), sequelize.col('branch.name')]
                });
                data = salesData.map(s => ({
                    branchName: s.branch ? s.branch.name : "Unknown",
                    totalSales: parseFloat(s.get('totalSales') || 0),
                    invoiceCount: parseInt(s.get('invoiceCount') || 0)
                }));
                break;

            case "stock_availability":
                // Stock Availability: Status = 1
                const stockFilter = { ...branchFilter, status: 1 };
                data = await equipmentMasterTbl.findAll({
                    where: stockFilter,
                    attributes: ['modelName', 'branchIdFk', [sequelize.fn('COUNT', sequelize.col('equipment_id_pk')), 'availableCount']],
                    include: [{ model: branchTbl, as: "branch", attributes: ["name"] }],
                    group: ['modelName', 'branchIdFk', sequelize.col('branch.branch_id_pk'), sequelize.col('branch.name')]
                });
                break;

            case "customer_outstanding":
                // Outstanding = Payment Status 1 or 2 (Pending/Partial) in Rentals and Sales
                const outstandingSales = await salesBillingTbl.findAll({
                    where: { ...branchFilter, paymentStatus: { [Op.in]: [1, 2] } },
                    include: [{ model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] }]
                });
                const outstandingRentals = await rentalAgreementTbl.findAll({
                    where: { ...branchFilter, paymentStatus: { [Op.in]: [1, 2] } },
                    include: [{ model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] }]
                });
                
                // Combine into unified format
                data = [
                    ...outstandingSales.map(s => ({ type: "Sale", ref: s.invoiceNo, customer: s.customer?.customerName, phone: s.customer?.customerPhone, total: s.grandTotal, date: s.billingDate, status: s.paymentStatus === 1 ? "Pending" : "Partial" })),
                    ...outstandingRentals.map(r => ({ type: "Rental", ref: r.id, customer: r.customer?.customerName, phone: r.customer?.customerPhone, total: parseFloat(r.rentalRate) + parseFloat(r.depositAmount), date: r.startDate, status: r.paymentStatus === 1 ? "Pending" : "Partial" }))
                ];
                break;

            case "expired_rentals":
                // Expired Rentals: endDate < today and not fully returned
                const today = dayjs().format('YYYY-MM-DD');
                data = await rentalAgreementTbl.findAll({
                    where: {
                        ...branchFilter,
                        endDate: { [Op.lt]: today },
                        status: { [Op.ne]: 3 } // 3 = Returned
                    },
                    include: [
                        { model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] }
                    ]
                });
                break;

            case "equipment_repair":
                // Equipment Under Repair: In Maintenance (status 2 = In Progress)
                data = await maintenanceTbl.findAll({
                    where: { ...branchFilter, status: 2 },
                    include: [
                        { model: equipmentMasterTbl, as: "equipment", attributes: ["modelName", "serialNumber"] },
                        { model: branchTbl, as: "branch", attributes: ["name"] }
                    ]
                });
                break;

            case "profitability":
                // Simple profit: Total Sales + Total Rentals - Total Maintenance Cost
                const totalSales = await salesBillingTbl.sum('grandTotal', { where: branchFilter }) || 0;
                const totalRentalsAmount = await rentalAgreementTbl.sum('rentalRate', { where: branchFilter }) || 0;
                const totalDepositAmount = await rentalAgreementTbl.sum('depositAmount', { where: branchFilter }) || 0;
                const totalRentals = parseFloat(totalRentalsAmount) + parseFloat(totalDepositAmount);
                const totalMaintenance = await maintenanceTbl.sum('cost', { where: branchFilter }) || 0;
                
                data = {
                    totalSales: parseFloat(totalSales),
                    totalRentals: parseFloat(totalRentals),
                    totalRevenue: parseFloat(totalSales) + parseFloat(totalRentals),
                    totalExpenses: parseFloat(totalMaintenance),
                    netProfit: (parseFloat(totalSales) + parseFloat(totalRentals)) - parseFloat(totalMaintenance)
                };
                break;

            case "monthly_rentals_returns":
                // Get monthly counts for rentals and returns for a specific year
                const year = req.query.year || new Date().getFullYear();
                const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
                const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
                
                // Fetch rentals created in the year
                const yearlyRentals = await rentalAgreementTbl.findAll({
                    where: {
                        ...branchFilter,
                        createdAt: { [Op.between]: [startDate, endDate] }
                    },
                    attributes: ['createdAt']
                });

                // Fetch returns (status 2 = Completed, 3 = Cancelled) updated in the year
                const yearlyReturns = await rentalAgreementTbl.findAll({
                    where: {
                        ...branchFilter,
                        status: { [Op.in]: [2, 3] },
                        updatedAt: { [Op.between]: [startDate, endDate] }
                    },
                    attributes: ['updatedAt']
                });

                const monthsStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                data = monthsStr.map(name => ({ name, rentals: 0, returns: 0 }));

                yearlyRentals.forEach(r => {
                    const m = new Date(r.createdAt).getMonth();
                    data[m].rentals += 1;
                });

                yearlyReturns.forEach(r => {
                    const m = new Date(r.updatedAt).getMonth();
                    data[m].returns += 1;
                });
                break;

            default:
                return res.status(400).json({ success: false, message: "Invalid report type" });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Error in getReports:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getReports
};
