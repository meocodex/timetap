// src/models/whatsapp_session.js
module.exports = (sequelize, DataTypes) => {
  const WhatsappSession = sequelize.define('WhatsappSession', {
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    session_data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    last_interaction: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'whatsapp_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  WhatsappSession.associate = function(models) {
    WhatsappSession.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    WhatsappSession.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
  };
  
  return WhatsappSession;
};
