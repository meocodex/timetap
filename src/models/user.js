// src/models/user.js
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
      unique: true,
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
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    establishment_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Hooks para criar hash da senha antes de salvar
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password_hash = await bcrypt.hash(user.password, 10);
          delete user.password;
        }
      },
      beforeUpdate: async (user) => {
        if (user.password) {
          user.password_hash = await bcrypt.hash(user.password, 10);
          delete user.password;
        }
      }
    }
  });
  
  // Método virtual para trabalhar com senha
  User.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };
  
  // Definir associações
  User.associate = function(models) {
    User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    User.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' });
    User.belongsToMany(models.Service, { 
      through: models.ProfessionalService, 
      foreignKey: 'professional_id', 
      as: 'services' 
    });
    User.hasMany(models.ProfessionalAvailability, { 
      foreignKey: 'professional_id', 
      as: 'availabilities' 
    });
    User.hasMany(models.Appointment, { 
      foreignKey: 'professional_id', 
      as: 'appointments' 
    });
  };
  
  return User;
};
