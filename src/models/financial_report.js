// src/models/financial_report.js
module.exports = (sequelize, DataTypes) => {
  const FinancialReport = sequelize.define('FinancialReport', {
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    report_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_revenue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    appointments_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'financial_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: null
  });
  
  // Definir associações
  FinancialReport.associate = function(models) {
    FinancialReport.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
  };
  
  return FinancialReport;
};
