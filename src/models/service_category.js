// src/models/service_category.js
module.exports = (sequelize, DataTypes) => {
  const ServiceCategory = sequelize.define('ServiceCategory', {
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'service_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  ServiceCategory.associate = function(models) {
    ServiceCategory.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
    ServiceCategory.hasMany(models.Service, { foreignKey: 'category_id', as: 'services' });
  };
  
  return ServiceCategory;
};
