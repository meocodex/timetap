// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Gerar tokens JWT
 */
const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user.id, role: user.role_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
  
  return { token, refreshToken };
};

class AuthController {
  /**
   * Login de usuário
   */
  static async login(req, res) {
    try {
      const { phone, password } = req.body;
      
      const user = await User.findOne({ where: { phone } });
      
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      if (!user.active) {
        return res.status(401).json({ message: 'Usuário está inativo' });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Atualizar último login
      user.last_login = new Date();
      await user.save();
      
      // Gerar tokens
      const { token, refreshToken } = generateTokens(user);
      
      // Remover senha da resposta
      const userData = user.toJSON();
      delete userData.password_hash;
      
      return res.status(200).json({
        user: userData,
        token,
        refreshToken
      });
    } catch (error) {
      logger.error(`Erro no login: ${error.message}`);
      return res.status(500).json({ message: 'Erro no servidor' });
    }
  }
  
  /**
   * Refresh token
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token não fornecido' });
      }
      
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password_hash'] }
        });
        
        if (!user) {
          return res.status(401).json({ message: 'Usuário não encontrado' });
        }
        
        if (!user.active) {
          return res.status(401).json({ message: 'Usuário está inativo' });
        }
        
        // Gerar novos tokens
        const { token, refreshToken: newRefreshToken } = generateTokens(user);
        
        return res.status(200).json({
          token,
          refreshToken: newRefreshToken
        });
      } catch (error) {
        logger.error(`Erro na validação do refresh token: ${error.message}`);
        return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
      }
    } catch (error) {
      logger.error(`Erro no refresh token: ${error.message}`);
      return res.status(500).json({ message: 'Erro no servidor' });
    }
  }
  
  /**
   * Logout
   */
  static async logout(req, res) {
    // Como estamos usando JWT, o logout é gerenciado no cliente
    // removendo os tokens. No servidor, não precisamos fazer nada.
    return res.status(200).json({ message: 'Logout realizado com sucesso' });
  }
}

module.exports = AuthController;
