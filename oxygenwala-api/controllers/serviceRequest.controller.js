const {
    serviceRequestTbl,
    customerTbl,
    equipmentMasterTbl,
    branchTbl
} = require("../sequelize");

const getServiceRequests = async (req, res) => {
    try {
        let whereCondition = {};
        if (req.userRole !== 1 && req.branchIdFk) {
            whereCondition.branchIdFk = req.branchIdFk;
        }

        const requests = await serviceRequestTbl.findAll({
            where: whereCondition,
            include: [
                { model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] },
                { model: branchTbl, as: "branch", attributes: ["name"] },
                { model: equipmentMasterTbl, as: "equipment", attributes: ["modelName", "serialNumber"] }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error("Error in getServiceRequests:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getServiceRequestById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, message: "ID is required" });

        const request = await serviceRequestTbl.findByPk(id, {
            include: [
                { model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] },
                { model: branchTbl, as: "branch", attributes: ["name"] },
                { model: equipmentMasterTbl, as: "equipment", attributes: ["modelName", "serialNumber"] }
            ]
        });

        if (!request) {
            return res.status(404).json({ success: false, message: "Service request not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && request.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        res.status(200).json({ success: true, request });
    } catch (error) {
        console.error("Error in getServiceRequestById:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const addServiceRequest = async (req, res) => {
    try {
        const {
            customerIdFk,
            branchIdFk,
            equipmentIdFk,
            requestDate,
            issueDescription,
            priority,
            status,
            resolutionNotes
        } = req.body;

        if (req.userRole !== 1 && req.branchIdFk && req.branchIdFk !== parseInt(branchIdFk)) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this branch" });
        }

        const count = await serviceRequestTbl.count();
        const requestNo = `SR-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

        const newRequest = await serviceRequestTbl.create({
            requestNo,
            customerIdFk,
            branchIdFk,
            equipmentIdFk: equipmentIdFk || null,
            requestDate,
            issueDescription,
            priority: priority || 2,
            status: status || 1,
            resolutionNotes
        });

        res.status(200).json({ success: true, message: "Service request created successfully", request: newRequest });
    } catch (error) {
        console.error("Error in addServiceRequest:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateServiceRequest = async (req, res) => {
    try {
        const {
            id,
            customerIdFk,
            branchIdFk,
            equipmentIdFk,
            requestDate,
            issueDescription,
            priority,
            status,
            resolutionNotes
        } = req.body;

        const request = await serviceRequestTbl.findByPk(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Service request not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && request.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        await request.update({
            customerIdFk: customerIdFk !== undefined ? customerIdFk : request.customerIdFk,
            branchIdFk: branchIdFk !== undefined ? branchIdFk : request.branchIdFk,
            equipmentIdFk: equipmentIdFk !== undefined ? (equipmentIdFk || null) : request.equipmentIdFk,
            requestDate: requestDate !== undefined ? requestDate : request.requestDate,
            issueDescription: issueDescription !== undefined ? issueDescription : request.issueDescription,
            priority: priority !== undefined ? priority : request.priority,
            status: status !== undefined ? status : request.status,
            resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : request.resolutionNotes
        });

        res.status(200).json({ success: true, message: "Service request updated successfully" });
    } catch (error) {
        console.error("Error in updateServiceRequest:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteServiceRequest = async (req, res) => {
    try {
        const { id } = req.body; 
        
        const request = await serviceRequestTbl.findByPk(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Service request not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && request.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        await request.destroy();

        res.status(200).json({ success: true, message: "Service request deleted successfully" });
    } catch (error) {
        console.error("Error in deleteServiceRequest:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getServiceRequests,
    getServiceRequestById,
    addServiceRequest,
    updateServiceRequest,
    deleteServiceRequest
};
