// src/websocket/websocket.js
const WebSocket = require('ws');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configurar o servidor WebSocket
const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({
    server,
    path: process.env.WEBSOCKET_PATH || '/ws'
  });

  wss.on('connection', (ws) => {
    console.log('Nova conexão WebSocket estabelecida');

    ws.on('message', (message) => {
      console.log('Mensagem recebida:', message);
      
      // Processar a mensagem recebida
      // ...
      
      // Enviar resposta
      ws.send(JSON.stringify({ type: 'response', data: 'Mensagem recebida com sucesso' }));
    });

    ws.on('close', () => {
      console.log('Conexão WebSocket fechada');
    });

    // Enviar mensagem inicial
    ws.send(JSON.stringify({ type: 'info', data: 'Conexão estabelecida com sucesso' }));
  });

  return wss;
};

module.exports = setupWebSocketServer;