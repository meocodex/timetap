// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');

// Rota de login
router.post(
  '/login',
  [
    body('phone').notEmpty().withMessage('Número de telefone é obrigatório'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
  ],
  validate,
  AuthController.login
);

// Rota de refresh token
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Token de atualização é obrigatório')
  ],
  validate,
  AuthController.refreshToken
);

// Rota de logout
router.post('/logout', AuthController.logout);

module.exports = router;
