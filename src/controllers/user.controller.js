// src/controllers/user.controller.js
const bcrypt = require('bcrypt');
const { User, Role } = require('../models');
const logger = require('../config/logger');

class UserController {
  /**
   * Listar todos os usuários (apenas para super admin)
   */
  static async findAll(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [
          { model: Role, as: 'role' }
        ]
      });
      
      return res.status(200).json(users);
    } catch (error) {
      logger.error(`Erro ao listar usuários: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
  }
  
  /**
   * Buscar usuário por ID
   */
  static async findById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          { model: Role, as: 'role' }
        ]
      });
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.id !== user.id && req.user.establishment_id !== user.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      logger.error(`Erro ao buscar usuário: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
  }
  
  /**
   * Criar novo usuário
   */
  static async create(req, res) {
    try {
      const { name, phone, email, document, password, role_id, establishment_id, active } = req.body;
      
      // Verificar se telefone já está cadastrado
      const existingUser = await User.findOne({ where: { phone } });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Número de telefone já cadastrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1) {
        // Admins só podem criar profissionais para seu próprio estabelecimento
        if (role_id !== 3 || req.user.establishment_id !== establishment_id) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      }
      
      const user = await User.create({
        name,
        phone,
        email,
        document,
        password, // Hook do model vai gerar o hash
        role_id,
        establishment_id,
        active: active !== undefined ? active : true
      });
      
      // Remover senha da resposta
      const userData = user.toJSON();
      delete userData.password_hash;
      
      return res.status(201).json(userData);
    } catch (error) {
      logger.error(`Erro ao criar usuário: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao criar usuário' });
    }
  }
  
  /**
   * Atualizar usuário
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, document, password, role_id, establishment_id, active } = req.body;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1) {
        // Admins só podem atualizar usuários do próprio estabelecimento
        if (req.user.establishment_id !== user.establishment_id) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
        
        // Admins não podem alterar role ou establishment
        if (role_id !== undefined || establishment_id !== undefined) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      }
      
      // Atualizar dados
      if (name) user.name = name;
      if (email) user.email = email;
      if (document) user.document = document;
      if (password) user.password = password; // Hook do model vai gerar o hash
      if (role_id !== undefined && req.user.role_id === 1) user.role_id = role_id;
      if (establishment_id !== undefined && req.user.role_id === 1) user.establishment_id = establishment_id;
      if (active !== undefined) user.active = active;
      
      await user.save();
      
      // Remover senha da resposta
      const userData = user.toJSON();
      delete userData.password_hash;
      
      return res.status(200).json(userData);
    } catch (error) {
      logger.error(`Erro ao atualizar usuário: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
  }
  
  /**
   * Deletar usuário (soft delete - apenas desativa)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== user.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Desativar usuário (soft delete)
      user.active = false;
      await user.save();
      
      return res.status(200).json({ message: 'Usuário desativado com sucesso' });
    } catch (error) {
      logger.error(`Erro ao deletar usuário: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao deletar usuário' });
    }
  }
  
  /**
   * Alterar senha do usuário logado
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      // Verificar senha atual
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }
      
      // Atualizar senha
      user.password = newPassword; // Hook do model vai gerar o hash
      await user.save();
      
      return res.status(200).json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      logger.error(`Erro ao alterar senha: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao alterar senha' });
    }
  }
  
  /**
   * Listar profissionais por estabelecimento
   */
  static async findProfessionalsByEstablishment(req, res) {
    try {
      const { establishmentId } = req.params;
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== parseInt(establishmentId)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const professionals = await User.findAll({
        where: {
          establishment_id: establishmentId,
          role_id: 3, // role de profissional
          active: true
        },
        attributes: { exclude: ['password_hash'] }
      });
      
      return res.status(200).json(professionals);
    } catch (error) {
      logger.error(`Erro ao listar profissionais: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar profissionais' });
    }
  }
}

module.exports = UserController;
