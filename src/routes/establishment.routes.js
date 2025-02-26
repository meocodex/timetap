// src/routes/establishment.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const EstablishmentController = require('../controllers/establishment.controller');
const { auth, isSuperAdmin, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Listar todos os estabelecimentos (apenas super admin)
router.get('/', isSuperAdmin, EstablishmentController.findAll);

// Buscar estabelecimento por ID
router.get('/:id', EstablishmentController.findById);

// Criar novo estabelecimento (apenas super admin)
router.post(
  '/',
  isSuperAdmin,
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('phone').notEmpty().withMessage('Telefone é obrigatório')
  ],
  validate,
  EstablishmentController.create
);

// Atualizar estabelecimento
router.put(
  '/:id',
  isAdmin,
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('phone').optional().notEmpty().withMessage('Telefone não pode ser vazio')
  ],
  validate,
  EstablishmentController.update
);

// Desativar estabelecimento (apenas super admin)
router.delete('/:id', isSuperAdmin, EstablishmentController.delete);

// Obter estatísticas do estabelecimento
router.get('/:id/stats', EstablishmentController.getStats);

module.exports = router;
