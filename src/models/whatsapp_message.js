// src/models/whatsapp_message.js
module.exports = (sequelize, DataTypes) => {
  const WhatsappMessage = sequelize.define('WhatsappMessage', {
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    direction: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['incoming', 'outgoing']]
      }
    },
    message_type: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'whatsapp_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: null
  });
  
  // Definir associações
  WhatsappMessage.associate = function(models) {
    WhatsappMessage.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
    WhatsappMessage.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    WhatsappMessage.belongsTo(models.Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
  };
  
  return WhatsappMessage;
};
