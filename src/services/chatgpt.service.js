// src/services/chatgpt.service.js
const { Configuration, OpenAIApi } = require("openai");
const logger = require('../config/logger');

/**
 * Classe para gerenciar a integração com ChatGPT para processamento
 * de linguagem natural e entendimento de intenções
 */
class ChatGPTService {
  /**
   * Inicialização do serviço com a API da OpenAI
   */
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.openai = new OpenAIApi(configuration);
  }
  
  /**
   * Processa uma mensagem para identificar intenção e entidades
   * @param {string} message - Mensagem enviada pelo cliente
   * @param {Object} sessionData - Dados da sessão atual
   * @returns {Object} - Intenção identificada, entidades extraídas e dados de sessão atualizados
   */
  async processMessage(message, sessionData) {
    try {
      // Preparar o contexto da conversa com base na sessão atual
      const conversationContext = this.prepareContext(sessionData);
      
      // Preparar prompt para o ChatGPT
      const prompt = this.buildPrompt(message, conversationContext);
      
      // Chamar API do ChatGPT
      const response = await this.openai.createCompletion({
        model: "gpt-3.5-turbo-instruct", // ou modelo mais atual
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.3,
        stop: ["###"]
      });
      
      // Analisar resposta
      const result = this.parseResponse(response.data.choices[0].text.trim());
      
      // Atualizar dados da sessão
      const updatedSessionData = this.updateSessionData(sessionData, result, message);
      
      return {
        intent: result.intent,
        entities: result.entities,
        sessionData: updatedSessionData
      };
    } catch (error) {
      logger.error(`Erro ao processar mensagem com ChatGPT: ${error.message}`);
      
      // Fallback básico para não interromper o fluxo em caso de falha
      return {
        intent: 'unknown',
        entities: {},
        sessionData: sessionData || { state: 'initial', context: {} }
      };
    }
  }
  
  /**
   * Prepara o contexto da conversa com base nos dados da sessão
   * @param {Object} sessionData - Dados da sessão atual
   * @returns {string} - Contexto da conversa formatado
   */
  prepareContext(sessionData) {
    if (!sessionData) {
      return "Nova conversa iniciada.";
    }
    
    let context = `Estado atual: ${sessionData.state || 'initial'}\n`;
    
    // Adicionar informações do fluxo de agendamento, se houver
    if (sessionData.bookingState) {
      context += `Fluxo de agendamento: ${sessionData.bookingState}\n`;
      
      if (sessionData.selectedService) {
        context += `Serviço selecionado: ${sessionData.selectedService}\n`;
      }
      
      if (sessionData.selectedProfessional) {
        context += `Profissional selecionado: ${sessionData.selectedProfessional}\n`;
      }
      
      if (sessionData.selectedDate) {
        context += `Data selecionada: ${sessionData.selectedDate}\n`;
      }
      
      if (sessionData.selectedTime) {
        context += `Horário selecionado: ${sessionData.selectedTime}\n`;
      }
    }
    
    // Adicionar contexto específico se disponível
    if (sessionData.context) {
      Object.entries(sessionData.context).forEach(([key, value]) => {
        context += `${key}: ${value}\n`;
      });
    }
    
    return context;
  }
  
  /**
   * Constrói o prompt para enviar ao ChatGPT
   * @param {string} message - Mensagem do cliente
   * @param {string} context - Contexto da conversa
   * @returns {string} - Prompt completo
   */
  buildPrompt(message, context) {
    return `
Você é um assistente virtual especializado em agendar serviços para estabelecimentos como salões de beleza, barbearias, clínicas e outros negócios que trabalham com agendamentos.

CONTEXTO DA CONVERSA:
${context}

MENSAGEM DO CLIENTE:
"${message}"

Analise a mensagem do cliente e identifique a intenção principal e quaisquer entidades relevantes.

Possíveis intenções:
- greeting: Saudação ou início de conversa
- booking_request: Solicitação de agendamento
- booking_confirmation: Confirmação de agendamento
- booking_cancel: Cancelamento de agendamento
- booking_reschedule: Remarcação de agendamento
- service_inquiry: Pergunta sobre serviços oferecidos
- professional_inquiry: Pergunta sobre profissionais disponíveis
- business_hours_inquiry: Pergunta sobre horário de funcionamento
- unknown: Intenção não identificada

Possíveis entidades:
- service: Nome ou tipo de serviço mencionado
- professional: Nome do profissional mencionado
- date: Data mencionada (pode ser específica como "15/05" ou relativa como "amanhã", "próxima segunda")
- time: Horário mencionado
- client_name: Nome do cliente (se informado)
- client_phone: Telefone do cliente (se informado)

Formato da resposta:
{
  "intent": "nome_da_intencao",
  "entities": {
    "entidade1": "valor1",
    "entidade2": "valor2"
  },
  "confidence": 0.XX
}

Responda apenas no formato JSON especificado acima.
###
`;
  }
  
  /**
   * Analisa a resposta do ChatGPT e extrai informações
   * @param {string} responseText - Texto de resposta do ChatGPT
   * @returns {Object} - Estrutura com intenção e entidades
   */
  parseResponse(responseText) {
    try {
      // Tentar extrair apenas o JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      
      // Parsear o JSON
      const parsed = JSON.parse(jsonStr);
      
      return {
        intent: parsed.intent || 'unknown',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      logger.error(`Erro ao analisar resposta do ChatGPT: ${error.message}`);
      
      // Fallback em caso de erro no parsing
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0
      };
    }
  }
  
  /**
   * Atualiza os dados da sessão com base no resultado da análise
   * @param {Object} sessionData - Dados da sessão atual
   * @param {Object} result - Resultado da análise da mensagem
   * @param {string} message - Mensagem original do cliente
   * @returns {Object} - Dados da sessão atualizados
   */
  updateSessionData(sessionData, result, message) {
    // Inicializar dados da sessão se não existirem
    const updatedData = sessionData || { state: 'initial', context: {} };
    
    // Atualizar estado com base na intenção identificada
    switch (result.intent) {
      case 'greeting':
        updatedData.state = 'greeting';
        break;
        
      case 'booking_request':
        updatedData.state = 'booking';
        updatedData.bookingState = updatedData.bookingState || 'service_selection';
        
        // Atualizar entidades identificadas
        if (result.entities.service) {
          updatedData.context.serviceQuery = result.entities.service;
        }
        
        if (result.entities.professional) {
          updatedData.context.professionalQuery = result.entities.professional;
        }
        
        if (result.entities.date) {
          updatedData.context.dateQuery = result.entities.date;
        }
        
        if (result.entities.time) {
          updatedData.context.timeQuery = result.entities.time;
        }
        break;
        
      case 'booking_confirmation':
        if (updatedData.bookingState === 'confirmation') {
          updatedData.bookingState = 'confirmed';
        }
        break;
        
      case 'booking_cancel':
        updatedData.state = 'cancellation';
        break;
        
      case 'booking_reschedule':
        updatedData.state = 'reschedule';
        updatedData.bookingState = 'date_selection';
        
        // Atualizar entidades de data/hora se identificadas
        if (result.entities.date) {
          updatedData.context.dateQuery = result.entities.date;
        }
        
        if (result.entities.time) {
          updatedData.context.timeQuery = result.entities.time;
        }
        break;
        
      case 'service_inquiry':
        updatedData.state = 'service_inquiry';
        
        if (result.entities.service) {
          updatedData.context.serviceQuery = result.entities.service;
        }
        break;
        
      case 'professional_inquiry':
        updatedData.state = 'professional_inquiry';
        
        if (result.entities.professional) {
          updatedData.context.professionalQuery = result.entities.professional;
        }
        break;
        
      case 'business_hours_inquiry':
        updatedData.state = 'business_hours_inquiry';
        break;
        
      default:
        // Se a intenção não for reconhecida, manter o estado atual
        break;
    }
    
    // Armazenar a mensagem original no histórico
    if (!updatedData.messageHistory) {
      updatedData.messageHistory = [];
    }
    
    // Limitar o histórico às últimas 10 mensagens
    if (updatedData.messageHistory.length >= 10) {
      updatedData.messageHistory.shift();
    }
    
    updatedData.messageHistory.push({
      message,
      intent: result.intent,
      timestamp: new Date().toISOString()
    });
    
    // Atualizar timestamp da última interação
    updatedData.lastInteraction = new Date().toISOString();
    
    return updatedData;
  }
}

module.exports = new ChatGPTService();
