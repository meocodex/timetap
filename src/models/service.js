// src/models/service.js
module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    has_commission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'services',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  Service.associate = function(models) {
    Service.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
    Service.belongsTo(models.ServiceCategory, { foreignKey: 'category_id', as: 'category' });
    Service.belongsToMany(models.User, { 
      through: models.ProfessionalService, 
      foreignKey: 'service_id', 
      as: 'professionals' 
    });
    Service.hasMany(models.Appointment, { foreignKey: 'service_id', as: 'appointments' });
  };
  
  return Service;
};
