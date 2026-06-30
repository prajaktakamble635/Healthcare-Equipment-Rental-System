const { notificationSettingsTbl } = require("../sequelize");

const getSettings = async (req, res) => {
    try {
        const branchIdFk = req.userRole !== 1 ? req.branchIdFk : (req.query.branchIdFk || null);
        let settings = await notificationSettingsTbl.findOne({
            where: { branchIdFk }
        });
        
        if (!settings) {
            // Create default settings if not exists
            settings = await notificationSettingsTbl.create({
                branchIdFk
            });
        }
        
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error("Error in getSettings:", error);
        res.status(500).json({ success: false, message: "Failed to load notification settings" });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { id, ...updateData } = req.body;
        
        // Prevent branch update override by subadmins
        if (req.userRole !== 1) {
            delete updateData.branchIdFk;
        }

        const settings = await notificationSettingsTbl.findByPk(id);
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not found" });
        }
        
        if (req.userRole !== 1 && settings.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await settings.update(updateData);
        res.status(200).json({ success: true, message: "Settings updated successfully", data: settings });
    } catch (error) {
        console.error("Error in updateSettings:", error);
        res.status(500).json({ success: false, message: "Failed to update notification settings" });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
