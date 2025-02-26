// src/models/establishment_setting.js
module.exports = (sequelize, DataTypes) => {
  const EstablishmentSetting = sequelize.define('EstablishmentSetting', {
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reminder_time: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    auto_confirm: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    welcome_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    confirmation_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminder_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    farewell_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'establishment_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  EstablishmentSetting.associate = function(models) {
    EstablishmentSetting.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
  };
  
  return EstablishmentSetting;
};
