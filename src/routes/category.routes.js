// src/routes/category.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const CategoryController = require('../controllers/category.controller');
const { auth, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Listar categorias por estabelecimento
router.get('/establishment/:establishmentId', CategoryController.findByEstablishment);

// Buscar categoria por ID
router.get('/:id', CategoryController.findById);

// Criar nova categoria
router.post(
  '/',
  isAdmin,
  [
    body('establishment_id').isInt().withMessage('ID de estabelecimento inválido'),
    body('name').notEmpty().withMessage('Nome é obrigatório')
  ],
  validate,
  CategoryController.create
);

// Atualizar categoria
router.put(
  '/:id',
  isAdmin,
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio')
  ],
  validate,
  CategoryController.update
);

// Deletar categoria (soft delete)
router.delete('/:id', isAdmin, CategoryController.delete);

module.exports = router;
