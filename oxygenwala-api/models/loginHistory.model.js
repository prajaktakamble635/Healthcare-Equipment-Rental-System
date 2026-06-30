module.exports = (sequelize, DataTypes) => {
  const loginHistory = sequelize.define('tbl_login_history', {
    userIdFk: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING, // e.g., "SUCCESS", "FAILED"
      allowNull: false,
    }
  });

  return loginHistory;
};
