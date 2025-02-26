// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { auth, isSuperAdmin, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Listar todos os usuários (apenas super admin)
router.get('/', isSuperAdmin, UserController.findAll);

// Buscar usuário por ID
router.get('/:id', UserController.findById);

// Criar novo usuário (apenas super admin e admin)
router.post(
  '/',
  isAdmin,
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('phone').notEmpty().withMessage('Telefone é obrigatório'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('role_id').isInt().withMessage('ID de role inválido'),
    body('establishment_id').optional().isInt().withMessage('ID de estabelecimento inválido')
  ],
  validate,
  UserController.create
);

// Atualizar usuário
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('password').optional().isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
  ],
  validate,
  UserController.update
);

// Deletar usuário (soft delete)
router.delete('/:id', UserController.delete);

// Alterar senha do usuário logado
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
  ],
  validate,
  UserController.changePassword
);

// Listar profissionais por estabelecimento
router.get('/establishment/:establishmentId/professionals', UserController.findProfessionalsByEstablishment);

module.exports = router;
