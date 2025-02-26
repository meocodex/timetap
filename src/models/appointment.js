// src/models/appointment.js
module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    professional_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    scheduled_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    scheduled_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    commission_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    confirmation_received: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Definir associações
  Appointment.associate = function(models) {
    Appointment.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
    Appointment.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
    Appointment.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
    Appointment.belongsTo(models.User, { foreignKey: 'professional_id', as: 'professional' });
    Appointment.belongsTo(models.AppointmentStatus, { foreignKey: 'status_id', as: 'status' });
    Appointment.hasMany(models.AppointmentHistory, { foreignKey: 'appointment_id', as: 'history' });
    Appointment.hasMany(models.WhatsappMessage, { foreignKey: 'appointment_id', as: 'messages' });
  };
  
  return Appointment;
};
