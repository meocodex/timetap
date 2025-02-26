// src/routes/professional.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ProfessionalController = require('../controllers/professional.controller');
const { auth, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Configurar disponibilidade do profissional
router.post(
  '/:professionalId/availability',
  isAdmin,
  [
    body('day_of_week').isInt({ min: 0, max: 6 }).withMessage('Dia da semana inválido (0-6)'),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Hora de início inválida'),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Hora de fim inválida')
  ],
  validate,
  ProfessionalController.setAvailability
);

// Listar disponibilidade do profissional
router.get(
  '/:professionalId/availability',
  ProfessionalController.getAvailability
);

// Remover disponibilidade
router.delete(
  '/availability/:availabilityId',
  isAdmin,
  ProfessionalController.removeAvailability
);

// Listar agendamentos do profissional
router.get(
  '/:professionalId/appointments',
  ProfessionalController.getAppointments
);

// Listar serviços do profissional
router.get(
  '/:professionalId/services',
  ProfessionalController.getServices
);

// Obter agenda do dia do profissional (para acesso via WhatsApp)
router.get(
  '/:professionalId/schedule/today',
  ProfessionalController.getTodaySchedule
);

module.exports = router;
