// src/models/appointment_history.js
module.exports = (sequelize, DataTypes) => {
  const AppointmentHistory = sequelize.define('AppointmentHistory', {
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    previous_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    new_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'appointment_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: null
  });
  
  // Definir associações
  AppointmentHistory.associate = function(models) {
    AppointmentHistory.belongsTo(models.Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
    AppointmentHistory.belongsTo(models.AppointmentStatus, { foreignKey: 'previous_status_id', as: 'previousStatus' });
    AppointmentHistory.belongsTo(models.AppointmentStatus, { foreignKey: 'new_status_id', as: 'newStatus' });
    AppointmentHistory.belongsTo(models.User, { foreignKey: 'changed_by', as: 'changedBy' });
  };
  
  return AppointmentHistory;
};
