const { rentalAgreementTbl, customerTbl, equipmentMasterTbl, branchTbl, equipmentCategoryTbl } = require("./sequelize");

async function test() {
    try {
        const agreements = await rentalAgreementTbl.findAll({
            include: [
                { model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] },
                {
                    model: equipmentMasterTbl, as: "equipment",
                    attributes: ["modelName", "serialNumber", "rentalRateDaily", "rentalRateWeekly", "rentalRateMonthly"],
                    include: [{ model: equipmentCategoryTbl, as: "category", attributes: ["categoryName"] }]
                },
                { model: branchTbl, as: "branch", attributes: ["name"] }
            ],
            order: [["createdAt", "DESC"]]
        });
        console.log("Success", agreements.length);
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}

test();
