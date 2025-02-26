// src/routes/client.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ClientController = require('../controllers/client.controller');
const { auth, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Listar clientes por estabelecimento
router.get('/establishment/:establishmentId', ClientController.findByEstablishment);

// Buscar cliente por ID
router.get('/:id', ClientController.findById);

// Criar novo cliente
router.post(
  '/',
  [
    body('establishment_id').isInt().withMessage('ID de estabelecimento inválido'),
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('phone').notEmpty().withMessage('Telefone é obrigatório')
  ],
  validate,
  ClientController.create
);

// Atualizar cliente
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('phone').optional().notEmpty().withMessage('Telefone não pode ser vazio')
  ],
  validate,
  ClientController.update
);

// Buscar cliente por telefone
router.get('/phone/:phone/establishment/:establishmentId', ClientController.findByPhone);

// Buscar histórico de agendamentos do cliente
router.get('/:id/appointments', ClientController.getAppointmentHistory);

module.exports = router;

// src/routes/appointment.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AppointmentController = require('../controllers/appointment.controller');
const { auth, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Listar agendamentos por estabelecimento e filtros
router.get('/establishment/:establishmentId', AppointmentController.findByEstablishment);

// Buscar agendamento por ID
router.get('/:id', AppointmentController.findById);

// Criar novo agendamento
router.post(
  '/',
  [
    body('establishment_id').isInt().withMessage('ID de estabelecimento inválido'),
    body('client_id').isInt().withMessage('ID de cliente inválido'),
    body('service_id').isInt().withMessage('ID de serviço inválido'),
    body('professional_id').isInt().withMessage('ID de profissional inválido'),
    body('scheduled_date').isDate().withMessage('Data inválida'),
    body('scheduled_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Hora inválida')
  ],
  validate,
  AppointmentController.create
);

// Atualizar status do agendamento
router.patch(
  '/:id/status',
  [
    body('status_id').isInt().withMessage('ID de status inválido')
  ],
  validate,
  AppointmentController.updateStatus
);

// Atualizar agendamento
router.put(
  '/:id',
  validate,
  AppointmentController.update
);

// Cancelar agendamento
router.post(
  '/:id/cancel',
  AppointmentController.cancel
);

// Buscar disponibilidade de horários para agendamento
router.get('/establishment/:establishmentId/availability', AppointmentController.getAvailability);

module.exports = router;
