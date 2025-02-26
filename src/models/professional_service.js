// src/models/professional_service.js
module.exports = (sequelize, DataTypes) => {
  const ProfessionalService = sequelize.define('ProfessionalService', {
    professional_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    custom_commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    }
  }, {
    tableName: 'professional_services',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: null
  });
  
  return ProfessionalService;
};

// src/models/professional_availability.js
module.exports = (sequelize, DataTypes) => {
  const ProfessionalAvailability = sequelize.define('ProfessionalAvailability', {
    professional_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 6
      }
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    }
  }, {
    tableName: 'professional_availability',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  ProfessionalAvailability.associate = function(models) {
    ProfessionalAvailability.belongsTo(models.User, { foreignKey: 'professional_id', as: 'professional' });
  };
  
  return ProfessionalAvailability;
};
