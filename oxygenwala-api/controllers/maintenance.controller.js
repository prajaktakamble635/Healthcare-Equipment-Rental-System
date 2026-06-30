const {
    maintenanceTbl,
    equipmentMasterTbl,
    branchTbl
} = require("../sequelize");

const getMaintenanceRecords = async (req, res) => {
    try {
        let whereCondition = {};
        if (req.userRole !== 1 && req.branchIdFk) {
            whereCondition.branchIdFk = req.branchIdFk;
        }

        const records = await maintenanceTbl.findAll({
            where: whereCondition,
            include: [
                { model: branchTbl, as: "branch", attributes: ["name"] },
                { model: equipmentMasterTbl, as: "equipment", attributes: ["modelName", "serialNumber"] }
            ],
            order: [["scheduledDate", "DESC"]]
        });

        res.status(200).json({ success: true, records });
    } catch (error) {
        console.error("Error in getMaintenanceRecords:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getMaintenanceById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, message: "ID is required" });

        const record = await maintenanceTbl.findByPk(id, {
            include: [
                { model: branchTbl, as: "branch", attributes: ["name"] },
                { model: equipmentMasterTbl, as: "equipment", attributes: ["modelName", "serialNumber"] }
            ]
        });

        if (!record) {
            return res.status(404).json({ success: false, message: "Maintenance record not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && record.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        res.status(200).json({ success: true, record });
    } catch (error) {
        console.error("Error in getMaintenanceById:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const addMaintenanceRecord = async (req, res) => {
    try {
        const {
            equipmentIdFk,
            branchIdFk,
            maintenanceType,
            scheduledDate,
            completedDate,
            cost,
            serviceProvider,
            status,
            notes
        } = req.body;

        if (req.userRole !== 1 && req.branchIdFk && req.branchIdFk !== parseInt(branchIdFk)) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this branch" });
        }

        const count = await maintenanceTbl.count();
        const maintenanceNo = `MAIN-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

        const newRecord = await maintenanceTbl.create({
            maintenanceNo,
            equipmentIdFk,
            branchIdFk,
            maintenanceType: maintenanceType || 1,
            scheduledDate,
            completedDate: completedDate || null,
            cost: cost || 0.00,
            serviceProvider,
            status: status || 1,
            notes
        });

        res.status(200).json({ success: true, message: "Maintenance record created successfully", record: newRecord });
    } catch (error) {
        console.error("Error in addMaintenanceRecord:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateMaintenanceRecord = async (req, res) => {
    try {
        const {
            id,
            equipmentIdFk,
            branchIdFk,
            maintenanceType,
            scheduledDate,
            completedDate,
            cost,
            serviceProvider,
            status,
            notes
        } = req.body;

        const record = await maintenanceTbl.findByPk(id);
        if (!record) {
            return res.status(404).json({ success: false, message: "Maintenance record not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && record.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        await record.update({
            equipmentIdFk: equipmentIdFk !== undefined ? equipmentIdFk : record.equipmentIdFk,
            branchIdFk: branchIdFk !== undefined ? branchIdFk : record.branchIdFk,
            maintenanceType: maintenanceType !== undefined ? maintenanceType : record.maintenanceType,
            scheduledDate: scheduledDate !== undefined ? scheduledDate : record.scheduledDate,
            completedDate: completedDate !== undefined ? (completedDate || null) : record.completedDate,
            cost: cost !== undefined ? cost : record.cost,
            serviceProvider: serviceProvider !== undefined ? serviceProvider : record.serviceProvider,
            status: status !== undefined ? status : record.status,
            notes: notes !== undefined ? notes : record.notes
        });

        res.status(200).json({ success: true, message: "Maintenance record updated successfully" });
    } catch (error) {
        console.error("Error in updateMaintenanceRecord:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteMaintenanceRecord = async (req, res) => {
    try {
        const { id } = req.body; 
        
        const record = await maintenanceTbl.findByPk(id);
        if (!record) {
            return res.status(404).json({ success: false, message: "Maintenance record not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && record.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        await record.destroy();

        res.status(200).json({ success: true, message: "Maintenance record deleted successfully" });
    } catch (error) {
        console.error("Error in deleteMaintenanceRecord:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getMaintenanceRecords,
    getMaintenanceById,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord
};
