// src/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const logger = require('./config/logger');
const routes = require('./routes');

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rotas
app.use('/api', routes);

// Rota de saúde
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok', message: 'Servidor funcionando corretamente' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`);
  
  return res.status(err.statusCode || 500).json({
    error: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Verificar conexão com o banco de dados
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
    
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado na porta ${PORT}`);
    });
  } catch (error) {
    logger.error('Não foi possível conectar ao banco de dados:', error);
    process.exit(1);
  }
})();

module.exports = app; // Para testes
