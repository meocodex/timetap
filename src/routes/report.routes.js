// src/routes/report.routes.js
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const { auth, isAdmin } = require('../middlewares/auth');

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Relatório financeiro diário
router.get('/establishment/:establishmentId/financial/daily', ReportController.getDailyFinancialReport);

// Relatório financeiro semanal
router.get('/establishment/:establishmentId/financial/weekly', ReportController.getWeeklyFinancialReport);

// Relatório financeiro mensal
router.get('/establishment/:establishmentId/financial/monthly', ReportController.getMonthlyFinancialReport);

// Relatório por profissional
router.get('/establishment/:establishmentId/professional/:professionalId', ReportController.getProfessionalReport);

// Relatório consolidado do estabelecimento
router.get('/establishment/:establishmentId/summary', ReportController.getEstablishmentSummary);

module.exports = router;

// src/routes/whatsapp.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const WhatsappController = require('../controllers/whatsapp.controller');
const { auth, isSuperAdmin, isAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Rota pública para webhook
router.post('/webhook', WhatsappController.handleWebhook);

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Configurar conexão WhatsApp
router.post(
  '/establishment/:establishmentId/setup',
  isAdmin,
  WhatsappController.setupConnection
);

// Verificar status da conexão
router.get(
  '/establishment/:establishmentId/status',
  WhatsappController.getConnectionStatus
);

// Enviar mensagem manual
router.post(
  '/send',
  [
    body('establishment_id').isInt().withMessage('ID de estabelecimento inválido'),
    body('phone').notEmpty().withMessage('Telefone é obrigatório'),
    body('message').notEmpty().withMessage('Mensagem é obrigatória')
  ],
  validate,
  WhatsappController.sendMessage
);

// Listar conversas recentes
router.get(
  '/establishment/:establishmentId/conversations',
  WhatsappController.getRecentConversations
);

// Buscar histórico de conversa com cliente
router.get(
  '/establishment/:establishmentId/client/:clientId/messages',
  WhatsappController.getClientConversation
);

module.exports = router;
