const {
    rentalAgreementTbl,
    customerTbl,
    equipmentMasterTbl,
    branchTbl,
    equipmentCategoryTbl
} = require("../sequelize");
const { Op } = require("sequelize");

const getRentalAgreements = async (req, res) => {
    try {
        let whereCondition = {};
        if (req.userRole !== 1 && req.branchIdFk) {
            whereCondition.branchIdFk = req.branchIdFk;
        }

        const agreements = await rentalAgreementTbl.findAll({
            where: whereCondition,
            include: [
                { model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] },
                {
                    model: equipmentMasterTbl, as: "equipment",
                    attributes: ["id", "modelName", "serialNumber", "rentalRateDaily", "rentalRateWeekly", "rentalRateMonthly"],
                    include: [{ model: equipmentCategoryTbl, as: "category", attributes: ["categoryName"] }]
                },
                { model: branchTbl, as: "branch", attributes: ["name"] }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({ success: true, agreements });
    } catch (error) {
        console.error("Error in getRentalAgreements:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const addRentalAgreement = async (req, res) => {
    try {
        const {
            customerIdFk,
            branchIdFk,
            equipments // Expected to be an array: [{ equipmentIdFk, startDate, endDate, rentalRate, depositAmount, billingCycle }]
        } = req.body;

        if (!equipments || !Array.isArray(equipments) || equipments.length === 0) {
            return res.status(400).json({ success: false, message: "No equipment provided" });
        }

        // Ensure user has access to this branch if not super admin
        if (req.userRole !== 1 && req.branchIdFk && req.branchIdFk !== parseInt(branchIdFk)) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this branch" });
        }

        const agreementsData = equipments.map(eq => ({
            customerIdFk,
            branchIdFk,
            startDate: eq.startDate,
            equipmentIdFk: eq.equipmentIdFk,
            endDate: eq.endDate || null,
            rentalRate: eq.rentalRate || 0,
            depositAmount: eq.depositAmount || 0,
            billingCycle: eq.billingCycle || "Monthly",
            status: 4 // 4 = Draft
        }));

        const agreements = await rentalAgreementTbl.bulkCreate(agreementsData);

        // Update status for all rented equipments to Rented (2) so they are reserved
        const equipmentIds = equipments.map(eq => eq.equipmentIdFk);
        await equipmentMasterTbl.update({ status: 2 }, { where: { id: equipmentIds } });

        res.status(200).json({ success: true, message: "Rental agreements created successfully", agreements });
    } catch (error) {
        console.error("Error in addRentalAgreement:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateRentalAgreement = async (req, res) => {
    try {
        const { id, branchIdFk, customerIdFk, equipmentIdFk, startDate, endDate, rentalRate, depositAmount, billingCycle, status, paymentStatus, amountPaid, paymentMode } = req.body;

        const agreement = await rentalAgreementTbl.findByPk(id);
        if (!agreement) {
            return res.status(404).json({ success: false, message: "Rental agreement not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && agreement.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        // Check if equipment changed
        if (equipmentIdFk && equipmentIdFk !== agreement.equipmentIdFk) {
            // Free the old equipment
            await equipmentMasterTbl.update({ status: 1 }, { where: { id: agreement.equipmentIdFk } });
            // Occupy the new equipment
            await equipmentMasterTbl.update({ status: 2 }, { where: { id: equipmentIdFk } });
        }

        await agreement.update({
            branchIdFk: branchIdFk || agreement.branchIdFk,
            customerIdFk: customerIdFk || agreement.customerIdFk,
            equipmentIdFk: equipmentIdFk || agreement.equipmentIdFk,
            startDate: startDate || agreement.startDate,
            endDate: endDate !== undefined ? endDate : agreement.endDate,
            rentalRate: rentalRate !== undefined ? rentalRate : agreement.rentalRate,
            depositAmount: depositAmount !== undefined ? depositAmount : agreement.depositAmount,
            billingCycle: billingCycle || agreement.billingCycle,
            status: status !== undefined ? status : agreement.status,
            paymentStatus: paymentStatus !== undefined ? paymentStatus : agreement.paymentStatus,
            amountPaid: amountPaid !== undefined ? amountPaid : agreement.amountPaid,
            paymentMode: paymentMode !== undefined ? paymentMode : agreement.paymentMode
        });

        // If status changed to Completed (2) or Cancelled (3), update equipment back to Available (1)
        if (status === 2 || status === 3) {
            await equipmentMasterTbl.update({ status: 1 }, { where: { id: agreement.equipmentIdFk } });
        } else if (status === 1) {
            // If changed back to Active, occupy equipment
            await equipmentMasterTbl.update({ status: 2 }, { where: { id: agreement.equipmentIdFk } });
        }

        res.status(200).json({ success: true, message: "Rental agreement updated successfully" });
    } catch (error) {
        console.error("Error in updateRentalAgreement:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteRentalAgreement = async (req, res) => {
    try {
        const { ids, id } = req.body; 
        let agreementIds = ids;
        if (!agreementIds && id) {
             agreementIds = [id];
        } else if (!agreementIds && req.query.id) {
             agreementIds = [req.query.id];
        }

        if (!agreementIds || !Array.isArray(agreementIds) || agreementIds.length === 0) {
             return res.status(400).json({ success: false, message: "No agreements provided for deletion" });
        }

        const agreements = await rentalAgreementTbl.findAll({ where: { id: agreementIds } });
        if (!agreements || agreements.length === 0) {
            return res.status(404).json({ success: false, message: "Rental agreements not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk) {
             const unauthorized = agreements.some(a => a.branchIdFk !== req.branchIdFk);
             if (unauthorized) {
                 return res.status(403).json({ success: false, message: "Unauthorized access to some agreements" });
             }
        }

        // Update equipment back to Available (1) before deleting the agreements
        const equipmentIds = agreements.map(a => a.equipmentIdFk);
        await equipmentMasterTbl.update({ status: 1 }, { where: { id: equipmentIds } });

        await rentalAgreementTbl.destroy({ where: { id: agreementIds } });

        res.status(200).json({ success: true, message: "Rental agreements deleted successfully" });
    } catch (error) {
        console.error("Error in deleteRentalAgreement:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const syncRentalAgreementBatch = async (req, res) => {
    try {
        const { branchIdFk, customerIdFk, equipments, deletedIds } = req.body;

        if (req.userRole !== 1 && req.branchIdFk && req.branchIdFk !== parseInt(branchIdFk)) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this branch" });
        }

        // 1. Handle Deletions
        if (deletedIds && deletedIds.length > 0) {
            const agreementsToDelete = await rentalAgreementTbl.findAll({ where: { id: deletedIds } });
            if (agreementsToDelete.length > 0) {
                const equipmentIdsToFree = agreementsToDelete.map(a => a.equipmentIdFk);
                await equipmentMasterTbl.update({ status: 1 }, { where: { id: equipmentIdsToFree } });
                await rentalAgreementTbl.destroy({ where: { id: deletedIds } });
            }
        }

        // 2. Handle Updates and Creations
        if (equipments && equipments.length > 0) {
            for (const eq of equipments) {
                if (eq.id) {
                    // Update existing
                    const agreement = await rentalAgreementTbl.findByPk(eq.id);
                    if (agreement) {
                        // Check if equipment changed
                        if (eq.equipmentIdFk && String(eq.equipmentIdFk) !== String(agreement.equipmentIdFk)) {
                            await equipmentMasterTbl.update({ status: 1 }, { where: { id: agreement.equipmentIdFk } });
                            await equipmentMasterTbl.update({ status: 2 }, { where: { id: eq.equipmentIdFk } });
                        } else if (eq.status && eq.status !== agreement.status) {
                             if (eq.status === 2 || eq.status === 3) {
                                 await equipmentMasterTbl.update({ status: 1 }, { where: { id: eq.equipmentIdFk } });
                             } else if (eq.status === 1) {
                                 await equipmentMasterTbl.update({ status: 2 }, { where: { id: eq.equipmentIdFk } });
                             }
                        }

                        await agreement.update({
                            branchIdFk: branchIdFk || agreement.branchIdFk,
                            customerIdFk: customerIdFk || agreement.customerIdFk,
                            equipmentIdFk: eq.equipmentIdFk || agreement.equipmentIdFk,
                            startDate: eq.startDate || agreement.startDate,
                            endDate: (eq.endDate === "" || eq.endDate === null) ? null : (eq.endDate !== undefined ? eq.endDate : agreement.endDate),
                            rentalRate: eq.rentalRate || agreement.rentalRate,
                            depositAmount: eq.depositAmount || agreement.depositAmount,
                            billingCycle: eq.billingCycle || agreement.billingCycle,
                            status: eq.status !== undefined ? eq.status : agreement.status
                        });
                    }
                } else {
                    // Create new
                    await rentalAgreementTbl.create({
                        customerIdFk,
                        branchIdFk,
                        startDate: eq.startDate,
                        equipmentIdFk: eq.equipmentIdFk,
                        endDate: (eq.endDate === "" || !eq.endDate) ? null : eq.endDate,
                        rentalRate: eq.rentalRate || 0,
                        depositAmount: eq.depositAmount || 0,
                        billingCycle: eq.billingCycle || "Monthly",
                        status: eq.status || 1
                    });
                    
                    if (!eq.status || eq.status === 1) {
                        await equipmentMasterTbl.update({ status: 2 }, { where: { id: eq.equipmentIdFk } });
                    }
                }
            }
        }

        res.status(200).json({ success: true, message: "Rental agreements batch synchronized successfully" });
    } catch (error) {
        console.error("Error in syncRentalAgreementBatch:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const markRentalDelivered = async (req, res) => {
    try {
        const { id } = req.body;
        const agreement = await rentalAgreementTbl.findByPk(id);
        if (!agreement) return res.status(404).json({ success: false, message: "Rental agreement not found" });

        if (Number(agreement.status) !== 5 && Number(agreement.status) !== 4) {
            return res.status(400).json({ success: false, message: "Agreement is not awaiting delivery" });
        }

        // Generate Token and update status to 1 (Active)
        await agreement.update({ status: 1 });

        res.status(200).json({ success: true, message: "Agreement marked as delivered and active. Token generated." });
    } catch (error) {
        console.error("Error in markRentalDelivered:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ================= DELIVERY ASSIGNMENT ================= */

const assignDeliveryStaff = async (req, res) => {
    try {
        const { ids, deliveryStaffIdFk } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Rental Agreement IDs are required." });
        }
        
        if (!deliveryStaffIdFk) {
            return res.status(400).json({ message: "Delivery Staff ID is required." });
        }
        
        const { userTbl } = require("../sequelize");
        const staff = await userTbl.findOne({
            where: { id: deliveryStaffIdFk, userRole: 5, status: 1 }
        });
        
        if (!staff) {
            return res.status(400).json({ message: "Invalid or inactive delivery staff." });
        }
        
        await rentalAgreementTbl.update(
            { deliveryStaffIdFk: deliveryStaffIdFk, status: 5 },
            { 
                where: { 
                    id: { [Op.in]: ids } 
                } 
            }
        );
        
        return res.status(200).json({ success: true, message: "Delivery staff assigned successfully." });
    } catch (error) {
        console.error("Error assignDeliveryStaff:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    getRentalAgreements,
    addRentalAgreement,
    updateRentalAgreement,
    deleteRentalAgreement,
    syncRentalAgreementBatch,
    markRentalDelivered,
    assignDeliveryStaff
};
