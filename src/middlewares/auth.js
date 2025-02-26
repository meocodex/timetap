// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Middleware para verificar autenticação do usuário
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Token mal formatado' });
    }
    
    const token = parts[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] }
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
      
      if (!user.active) {
        return res.status(401).json({ message: 'Usuário está inativo' });
      }
      
      req.user = user;
      
      next();
    } catch (error) {
      logger.error(`Erro na validação do token: ${error.message}`);
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
  } catch (error) {
    logger.error(`Erro no middleware de autenticação: ${error.message}`);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
};

/**
 * Middleware para verificar permissões de super admin
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role_id !== 1) { // 1 = super_admin
    return res.status(403).json({ message: 'Acesso negado. Permissão de Super Admin necessária.' });
  }
  
  next();
};

/**
 * Middleware para verificar permissões de admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || (req.user.role_id !== 1 && req.user.role_id !== 2)) { // 1 = super_admin, 2 = admin
    return res.status(403).json({ message: 'Acesso negado. Permissão de Admin necessária.' });
  }
  
  next();
};

/**
 * Middleware para verificar se usuário pertence ao estabelecimento
 */
const belongsToEstablishment = (req, res, next) => {
  const establishmentId = parseInt(req.params.establishmentId) || parseInt(req.body.establishmentId);
  
  if (!establishmentId) {
    return res.status(400).json({ message: 'ID do estabelecimento não fornecido' });
  }
  
  // Super admin pode acessar qualquer estabelecimento
  if (req.user.role_id === 1) {
    return next();
  }
  
  // Admin ou profissional só pode acessar seu próprio estabelecimento
  if (req.user.establishment_id !== establishmentId) {
    return res.status(403).json({ message: 'Acesso negado. Você não pertence a este estabelecimento.' });
  }
  
  next();
};

module.exports = {
  auth,
  isSuperAdmin,
  isAdmin,
  belongsToEstablishment
};
