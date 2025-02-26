// src/models/appointment_status.js
module.exports = (sequelize, DataTypes) => {
  const AppointmentStatus = sequelize.define('AppointmentStatus', {
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
    }
  }, {
    tableName: 'appointment_status',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: null
  });
  
  // Definir associações
  AppointmentStatus.associate = function(models) {
    AppointmentStatus.hasMany(models.Appointment, { foreignKey: 'status_id', as: 'appointments' });
  };
  
  return AppointmentStatus;
};
