// src/routes/index.js
const express = require('express');
const router = express.Router();

// Importar rotas específicas
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const establishmentRoutes = require('./establishment.routes');
const categoryRoutes = require('./category.routes');
const serviceRoutes = require('./service.routes');
const professionalRoutes = require('./professional.routes');
const appointmentRoutes = require('./appointment.routes');
const clientRoutes = require('./client.routes');
const reportRoutes = require('./report.routes');
const whatsappRoutes = require('./whatsapp.routes');

// Definir rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/establishments', establishmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/services', serviceRoutes);
router.use('/professionals', professionalRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/clients', clientRoutes);
router.use('/reports', reportRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;
