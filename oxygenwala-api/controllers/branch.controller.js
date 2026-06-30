const { branchTbl } = require("../sequelize");

// Create Branch
exports.createBranch = async (req, res) => {
  try {
    const { name, address, contactDetails, status } = req.body;
    const branch = await branchTbl.create({
      name,
      address,
      contactDetails,
      status: status || 1,
    });
    return res.status(201).json({ message: "Branch created successfully", branch });
  } catch (error) {
    return res.status(500).json({ message: "Error creating branch", error: error.message });
  }
};

// Get All Branches (For Table with Pagination)
exports.getTableBranch = async (req, res) => {
  try {
    const { currentPage, perPage, orderBy, orderDirection, searchValue } = req.body;
    
    const limit = parseInt(perPage) || 50;
    const offset = (parseInt(currentPage) - 1) * limit;
    
    let whereClause = {};
    if (searchValue) {
      whereClause.name = { [require('sequelize').Op.like]: `%${searchValue}%` };
    }

    const { count, rows } = await branchTbl.findAndCountAll({
      where: whereClause,
      order: [[orderBy || 'createdAt', orderDirection || 'desc']],
      limit,
      offset,
    });

    return res.status(200).json({ totalRecords: count, tableData: rows });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching branches", error: error.message });
  }
};

// Get All Branches (List for dropdowns)
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await branchTbl.findAll({
      where: { status: 1 },
      order: [["name", "ASC"]],
    });
    return res.status(200).json({ branches });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching branches", error: error.message });
  }
};

// Update Branch
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contactDetails, status } = req.body;
    
    const branch = await branchTbl.findByPk(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.update({ name, address, contactDetails, status });
    return res.status(200).json({ message: "Branch updated successfully", branch });
  } catch (error) {
    return res.status(500).json({ message: "Error updating branch", error: error.message });
  }
};

// Delete Branch
exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await branchTbl.findByPk(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.destroy();
    return res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting branch", error: error.message });
  }
};

// Change Branch Status
exports.changeStatusBranch = async (req, res) => {
  try {
    const { id, statusValue } = req.body;
    const branch = await branchTbl.findByPk(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    
    await branch.update({ status: statusValue });
    return res.status(200).json({ message: "Branch status updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating branch status", error: error.message });
  }
};
