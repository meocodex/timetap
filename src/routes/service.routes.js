// src/routes/service.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ServiceController = require('../controllers/service.controller');
const { auth, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Listar serviços por estabelecimento
router.get('/establishment/:establishmentId', ServiceController.findByEstablishment);

// Buscar serviço por ID
router.get('/:id', ServiceController.findById);

// Criar novo serviço
router.post(
  '/',
  isAdmin,
  [
    body('establishment_id').isInt().withMessage('ID de estabelecimento inválido'),
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('duration').isInt({ min: 5 }).withMessage('Duração deve ser um número inteiro maior que 5'),
    body('price').isFloat({ min: 0 }).withMessage('Preço deve ser um número maior ou igual a 0')
  ],
  validate,
  ServiceController.create
);

// Atualizar serviço
router.put(
  '/:id',
  isAdmin,
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('duration').optional().isInt({ min: 5 }).withMessage('Duração deve ser um número inteiro maior que 5'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Preço deve ser um número maior ou igual a 0')
  ],
  validate,
  ServiceController.update
);

// Deletar serviço (soft delete)
router.delete('/:id', isAdmin, ServiceController.delete);

// Listar serviços por profissional
router.get('/professional/:professionalId', ServiceController.findByProfessional);

// Adicionar profissional a um serviço
router.post(
  '/:serviceId/professionals/:professionalId',
  isAdmin,
  ServiceController.addProfessional
);

// Remover profissional de um serviço
router.delete(
  '/:serviceId/professionals/:professionalId',
  isAdmin,
  ServiceController.removeProfessional
);

module.exports = router;
