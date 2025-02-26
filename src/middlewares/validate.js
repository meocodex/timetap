// src/middlewares/validate.js
const { validationResult } = require('express-validator');

/**
 * Middleware para validar dados das requisições
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  next();
};

module.exports = validate;
