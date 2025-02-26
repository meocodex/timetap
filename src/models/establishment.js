// src/models/establishment.js
module.exports = (sequelize, DataTypes) => {
  const Establishment = sequelize.define('Establishment', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    document: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    opening_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    closing_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    working_days: {
      type: DataTypes.STRING,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'establishments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  Establishment.associate = function(models) {
    Establishment.hasMany(models.User, { foreignKey: 'establishment_id', as: 'users' });
    Establishment.hasMany(models.ServiceCategory, { foreignKey: 'establishment_id', as: 'categories' });
    Establishment.hasMany(models.Service, { foreignKey: 'establishment_id', as: 'services' });
    Establishment.hasMany(models.Client, { foreignKey: 'establishment_id', as: 'clients' });
    Establishment.hasMany(models.Appointment, { foreignKey: 'establishment_id', as: 'appointments' });
    Establishment.hasOne(models.EstablishmentSetting, { foreignKey: 'establishment_id', as: 'settings' });
  };
  
  return Establishment;
};
