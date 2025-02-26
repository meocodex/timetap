// src/models/professional_report.js
module.exports = (sequelize, DataTypes) => {
  const ProfessionalReport = sequelize.define('ProfessionalReport', {
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    professional_id: {
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
    tableName: 'professional_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: null
  });
  
  // Definir associações
  ProfessionalReport.associate = function(models) {
    ProfessionalReport.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
    ProfessionalReport.belongsTo(models.User, { foreignKey: 'professional_id', as: 'professional' });
  };
  
  return ProfessionalReport;
};
