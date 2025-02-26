// src/models/client.js
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
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
    document: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  Client.associate = function(models) {
    Client.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
    Client.hasMany(models.Appointment, { foreignKey: 'client_id', as: 'appointments' });
    Client.hasMany(models.WhatsappMessage, { foreignKey: 'client_id', as: 'messages' });
    Client.hasOne(models.WhatsappSession, { foreignKey: 'client_id', as: 'session' });
  };
  
  return Client;
};
