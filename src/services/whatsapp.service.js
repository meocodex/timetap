// src/services/whatsapp.service.js
const axios = require('axios');
const logger = require('../config/logger');
const { 
  Client, 
  WhatsappSession, 
  WhatsappMessage, 
  Establishment,
  Service,
  User,
  Appointment,
  AppointmentStatus
} = require('../models');
const chatgptService = require('./chatgpt.service');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Classe para gerenciar a integração com o WhatsApp via Evolution API
 */
class WhatsappService {
  /**
   * Configuração base para requisições à Evolution API
   */
  constructor() {
    this.api = axios.create({
      baseURL: process.env.EVOLUTION_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY
      }
    });
  }

  /**
   * Configurar conexão do WhatsApp para um estabelecimento
   * @param {string} instanceName - Nome da instância (geralmente o ID do estabelecimento)
   * @param {string} phoneNumber - Número de telefone do estabelecimento
   */
  async setupConnection(instanceName, phoneNumber) {
    try {
      // Verificar se a instância já existe
      const checkResponse = await this.api.get(`/instance/connectionState/${instanceName}`);
      
      if (checkResponse.data.state !== 'open') {
        // Criar instância se não existir ou não estiver conectada
        await this.api.post('/instance/create', {
          instanceName,
          token: process.env.EVOLUTION_API_KEY,
          qrcode: true,
          webhook: `${process.env.API_URL}/api/whatsapp/webhook`
        });
        
        logger.info(`Instância WhatsApp criada: ${instanceName}`);
      }
      
      return { 
        success: true, 
        message: 'Conexão configurada com sucesso',
        qrCodeUrl: `${process.env.EVOLUTION_API_URL}/instance/qrcode/${instanceName}?image=true`
      };
    } catch (error) {
      logger.error(`Erro ao configurar conexão WhatsApp: ${error.message}`);
      throw new Error('Falha ao configurar conexão com o WhatsApp');
    }
  }

  /**
   * Verificar status da conexão
   * @param {string} instanceName - Nome da instância
   */
  async getConnectionStatus(instanceName) {
    try {
      const response = await this.api.get(`/instance/connectionState/${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error(`Erro ao verificar status da conexão: ${error.message}`);
      throw new Error('Falha ao verificar status da conexão com o WhatsApp');
    }
  }

  /**
   * Enviar mensagem de texto
   * @param {string} to - Número de telefone do destinatário
   * @param {string} from - Número de telefone do remetente (instância)
   * @param {string} message - Mensagem a ser enviada
   */
  async sendTextMessage(to, from, message) {
    try {
      const instanceName = `establishment_${from.replace(/\D/g, '')}`;
      
      const response = await this.api.post(`/message/text/${instanceName}`, {
        number: to.replace(/\D/g, ''),
        options: {
          delay: 1200
        },
        textMessage: {
          text: message
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem de texto: ${error.message}`);
      throw new Error('Falha ao enviar mensagem de texto');
    }
  }

  /**
   * Enviar mensagem com botões
   * @param {string} to - Número de telefone do destinatário
   * @param {string} from - Número de telefone do remetente (instância)
   * @param {string} message - Texto da mensagem
   * @param {Array} buttons - Array de botões (máximo 3)
   */
  async sendButtonMessage(to, from, message, buttons) {
    try {
      const instanceName = `establishment_${from.replace(/\D/g, '')}`;
      
      // Limitar para 3 botões (limite do WhatsApp)
      const buttonsList = buttons.slice(0, 3).map((button, index) => ({
        id: `button_${index}`,
        text: button.text
      }));
      
      const response = await this.api.post(`/message/button/${instanceName}`, {
        number: to.replace(/\D/g, ''),
        options: {
          delay: 1200
        },
        buttonMessage: {
          title: "Escolha uma opção:",
          description: message,
          footerText: "Responda clicando em um botão",
          buttons: buttonsList
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem com botões: ${error.message}`);
      throw new Error('Falha ao enviar mensagem com botões');
    }
  }

  /**
   * Enviar mensagem com lista
   * @param {string} to - Número de telefone do destinatário
   * @param {string} from - Número de telefone do remetente (instância)
   * @param {string} message - Texto da mensagem
   * @param {string} buttonText - Texto do botão para abrir a lista
   * @param {Array} sections - Seções da lista
   */
  async sendListMessage(to, from, message, buttonText, sections) {
    try {
      const instanceName = `establishment_${from.replace(/\D/g, '')}`;
      
      const response = await this.api.post(`/message/list/${instanceName}`, {
        number: to.replace(/\D/g, ''),
        options: {
          delay: 1200
        },
        listMessage: {
          title: "Menu de opções",
          description: message,
          buttonText: buttonText,
          footerText: "Selecione uma opção da lista",
          sections: sections
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem com lista: ${error.message}`);
      throw new Error('Falha ao enviar mensagem com lista');
    }
  }

  /**
   * Processar mensagem recebida
   * @param {Object} data - Dados da mensagem recebida
   */
  async processIncomingMessage(data) {
    try {
      // Extrair informações da mensagem
      const instanceName = data.instance.instanceName;
      const establishmentPhone = instanceName.replace('establishment_', '');
      
      // Buscar estabelecimento pelo número de telefone
      const establishment = await Establishment.findOne({
        where: {
          phone: {
            [Op.like]: `%${establishmentPhone}%`
          },
          active: true
        }
      });
      
      if (!establishment) {
        logger.warn(`Estabelecimento não encontrado para o número: ${establishmentPhone}`);
        return;
      }
      
      // Extrair dados da mensagem
      const message = data.message.text?.body || data.message.buttonResponseMessage?.selectedButtonId || data.message.listResponseMessage?.title || '';
      const senderPhone = data.key.remoteJid.split('@')[0];
      
      // Verificar se é um profissional solicitando agenda
      const professional = await User.findOne({
        where: {
          phone: {
            [Op.like]: `%${senderPhone}%`
          },
          establishment_id: establishment.id,
          role_id: 3, // professional
          active: true
        }
      });
      
      if (professional && message.toLowerCase().includes('minha agenda')) {
        // Enviar agenda do profissional
        return await this.sendProfessionalSchedule(professional, establishment);
      }
      
      // Buscar ou criar cliente
      let client = await Client.findOne({
        where: {
          phone: {
            [Op.like]: `%${senderPhone}%`
          },
          establishment_id: establishment.id
        }
      });
      
      if (!client) {
        // Criar cliente novo
        client = await Client.create({
          establishment_id: establishment.id,
          name: `Cliente ${senderPhone}`, // Nome temporário
          phone: senderPhone
        });
        
        logger.info(`Novo cliente criado: ${client.id} - ${senderPhone}`);
      }
      
      // Registrar mensagem recebida
      await WhatsappMessage.create({
        establishment_id: establishment.id,
        client_id: client.id,
        message,
        direction: 'incoming',
        message_type: data.message.type || 'text'
      });
      
      // Buscar ou criar sessão de conversa
      let session = await WhatsappSession.findOne({
        where: {
          client_id: client.id,
          establishment_id: establishment.id
        }
      });
      
      if (!session) {
        session = await WhatsappSession.create({
          client_id: client.id,
          establishment_id: establishment.id,
          session_data: {
            state: 'initial',
            context: {}
          },
          last_interaction: new Date()
        });
      } else {
        // Atualizar última interação
        session.last_interaction = new Date();
        await session.save();
      }
      
      // Processar mensagem com ChatGPT para identificar intenção
      const chatResponse = await chatgptService.processMessage(message, session.session_data);
      
      // Atualizar dados da sessão
      session.session_data = chatResponse.sessionData;
      await session.save();
      
      // Executar ação baseada na intenção identificada
      return await this.handleIntent(client, establishment, chatResponse.intent, chatResponse.entities, session.session_data);
    } catch (error) {
      logger.error(`Erro ao processar mensagem recebida: ${error.message}`);
    }
  }

  /**
   * Tratar intenção identificada
   * @param {Object} client - Cliente que enviou a mensagem
   * @param {Object} establishment - Estabelecimento destinatário
   * @param {string} intent - Intenção identificada
   * @param {Object} entities - Entidades extraídas
   * @param {Object} sessionData - Dados da sessão
   */
  async handleIntent(client, establishment, intent, entities, sessionData) {
    switch (intent) {
      case 'greeting':
        return await this.handleGreeting(client, establishment);
      
      case 'booking_request':
        return await this.handleBookingRequest(client, establishment, entities, sessionData);
      
      case 'booking_confirmation':
        return await this.handleBookingConfirmation(client, establishment, sessionData);
      
      case 'booking_cancel':
        return await this.handleBookingCancel(client, establishment, sessionData);
      
      case 'booking_reschedule':
        return await this.handleBookingReschedule(client, establishment, entities, sessionData);
      
      case 'service_inquiry':
        return await this.handleServiceInquiry(client, establishment, entities);
      
      case 'professional_inquiry':
        return await this.handleProfessionalInquiry(client, establishment, entities);
      
      case 'business_hours_inquiry':
        return await this.handleBusinessHoursInquiry(client, establishment);
      
      default:
        return await this.handleUnknownIntent(client, establishment);
    }
  }

  /**
   * Tratar saudação
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   */
  async handleGreeting(client, establishment) {
    try {
      // Buscar configurações do estabelecimento
      const settings = await EstablishmentSetting.findOne({
        where: { establishment_id: establishment.id }
      });
      
      const welcomeMessage = settings?.welcome_message || 
        `Olá! Bem-vindo(a) a ${establishment.name}. Como posso ajudar você hoje?`;
      
      // Enviar mensagem com botões para opções comuns
      return await this.sendButtonMessage(
        client.phone,
        establishment.phone,
        welcomeMessage,
        [
          { text: "Agendar serviço" },
          { text: "Ver serviços" },
          { text: "Horário de funcionamento" }
        ]
      );
    } catch (error) {
      logger.error(`Erro ao tratar saudação: ${error.message}`);
      
      // Fallback para mensagem de texto simples
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Olá! Bem-vindo(a) a ${establishment.name}. Como posso ajudar?`
      );
    }
  }

  /**
   * Tratar solicitação de agendamento
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   * @param {Object} entities - Entidades extraídas
   * @param {Object} sessionData - Dados da sessão
   */
  async handleBookingRequest(client, establishment, entities, sessionData) {
    try {
      // Estado atual do fluxo de agendamento
      const state = sessionData.bookingState || 'service_selection';
      
      switch (state) {
        case 'service_selection':
          return await this.handleServiceSelection(client, establishment, entities, sessionData);
        
        case 'professional_selection':
          return await this.handleProfessionalSelection(client, establishment, entities, sessionData);
        
        case 'date_selection':
          return await this.handleDateSelection(client, establishment, entities, sessionData);
        
        case 'time_selection':
          return await this.handleTimeSelection(client, establishment, entities, sessionData);
        
        case 'confirmation':
          return await this.handleBookingConfirmation(client, establishment, sessionData);
        
        default:
          return await this.handleServiceSelection(client, establishment, entities, sessionData);
      }
    } catch (error) {
      logger.error(`Erro ao tratar solicitação de agendamento: ${error.message}`);
      
      // Fallback para mensagem de texto simples
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao processar seu agendamento. Por favor, tente novamente ou entre em contato por telefone.`
      );
    }
  }

  /**
   * Tratar seleção de serviço
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   * @param {Object} entities - Entidades extraídas
   * @param {Object} sessionData - Dados da sessão
   */
  async handleServiceSelection(client, establishment, entities, sessionData) {
    try {
      // Verificar se já identificou o serviço nas entidades
      if (entities.service) {
        // Buscar serviço pelo nome ou palavras-chave
        const service = await Service.findOne({
          where: {
            establishment_id: establishment.id,
            active: true,
            name: {
              [Op.iLike]: `%${entities.service}%`
            }
          }
        });
        
        if (service) {
          // Atualizar sessão com serviço selecionado
          sessionData.bookingState = 'professional_selection';
          sessionData.selectedService = service.id;
          
          await WhatsappSession.update(
            { session_data: sessionData },
            { where: { client_id: client.id, establishment_id: establishment.id } }
          );
          
          // Avançar para seleção de profissional
          return await this.handleProfessionalSelection(client, establishment, entities, sessionData);
        }
      }
      
      // Buscar serviços disponíveis
      const services = await Service.findAll({
        where: {
          establishment_id: establishment.id,
          active: true
        },
        include: [
          { 
            model: User, 
            as: 'professionals',
            required: true,
            attributes: ['id']
          }
        ]
      });
      
      if (services.length === 0) {
        return await this.sendTextMessage(
          client.phone,
          establishment.phone,
          `Desculpe, não temos serviços disponíveis no momento. Por favor, entre em contato por telefone para mais informações.`
        );
      }
      
      // Agrupar serviços por categoria para o menu
      const servicesByCategoryMap = new Map();
      
      for (const service of services) {
        if (!servicesByCategoryMap.has(service.category_id)) {
          servicesByCategoryMap.set(service.category_id, []);
        }
        
        servicesByCategoryMap.get(service.category_id).push(service);
      }
      
      // Preparar seções para mensagem de lista
      const sections = [];
      
      for (const [categoryId, categoryServices] of servicesByCategoryMap) {
        const category = await ServiceCategory.findByPk(categoryId);
        
        const rows = categoryServices.map(service => ({
          title: service.name,
          description: `R$ ${service.price.toFixed(2)} - ${service.duration} minutos`,
          rowId: `service_${service.id}`
        }));
        
        sections.push({
          title: category?.name || "Serviços",
          rows
        });
      }
      
      // Enviar mensagem com lista de serviços
      return await this.sendListMessage(
        client.phone,
        establishment.phone,
        "Qual serviço você gostaria de agendar?",
        "Ver serviços",
        sections
      );
    } catch (error) {
      logger.error(`Erro ao tratar seleção de serviço: ${error.message}`);
      
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao listar os serviços. Por favor, tente novamente ou entre em contato por telefone.`
      );
    }
  }

  /**
   * Tratar seleção de profissional
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   * @param {Object} entities - Entidades extraídas
   * @param {Object} sessionData - Dados da sessão
   */
  async handleProfessionalSelection(client, establishment, entities, sessionData) {
    try {
      // Verificar se temos o serviço selecionado
      if (!sessionData.selectedService) {
        // Voltar para seleção de serviço
        sessionData.bookingState = 'service_selection';
        
        await WhatsappSession.update(
          { session_data: sessionData },
          { where: { client_id: client.id, establishment_id: establishment.id } }
        );
        
        return await this.handleServiceSelection(client, establishment, entities, sessionData);
      }
      
      // Verificar se já identificou o profissional nas entidades
      if (entities.professional) {
        // Buscar profissional pelo nome
        const professional = await User.findOne({
          where: {
            establishment_id: establishment.id,
            role_id: 3, // professional
            active: true,
            name: {
              [Op.iLike]: `%${entities.professional}%`
            }
          },
          include: [
            {
              model: Service,
              as: 'services',
              where: { id: sessionData.selectedService },
              required: true
            }
          ]
        });
        
        if (professional) {
          // Atualizar sessão com profissional selecionado
          sessionData.bookingState = 'date_selection';
          sessionData.selectedProfessional = professional.id;
          
          await WhatsappSession.update(
            { session_data: sessionData },
            { where: { client_id: client.id, establishment_id: establishment.id } }
          );
          
          // Avançar para seleção de data
          return await this.handleDateSelection(client, establishment, entities, sessionData);
        }
      }
      
      // Buscar profissionais disponíveis para o serviço
      const service = await Service.findByPk(sessionData.selectedService);
      
      const professionals = await User.findAll({
        include: [
          {
            model: Service,
            as: 'services',
            where: { id: sessionData.selectedService },
            required: true
          }
        ],
        where: {
          establishment_id: establishment.id,
          role_id: 3, // professional
          active: true
        }
      });
      
      if (professionals.length === 0) {
        return await this.sendTextMessage(
          client.phone,
          establishment.phone,
          `Desculpe, não temos profissionais disponíveis para o serviço selecionado. Por favor, escolha outro serviço.`
        );
      }
      
      if (professionals.length === 1) {
        // Se houver apenas um profissional, selecioná-lo automaticamente
        sessionData.bookingState = 'date_selection';
        sessionData.selectedProfessional = professionals[0].id;
        
        await WhatsappSession.update(
          { session_data: sessionData },
          { where: { client_id: client.id, establishment_id: establishment.id } }
        );
        
        await this.sendTextMessage(
          client.phone,
          establishment.phone,
          `Serviço: ${service.name} com ${professionals[0].name}`
        );
        
        // Avançar para seleção de data
        return await this.handleDateSelection(client, establishment, entities, sessionData);
      }
      
      // Preparar lista de profissionais
      const rows = professionals.map(professional => ({
        title: professional.name,
        description: `Profissional disponível para ${service.name}`,
        rowId: `professional_${professional.id}`
      }));
      
      // Enviar mensagem com lista de profissionais
      return await this.sendListMessage(
        client.phone,
        establishment.phone,
        `Para o serviço "${service.name}", qual profissional você prefere?`,
        "Ver profissionais",
        [{ title: "Profissionais disponíveis", rows }]
      );
    } catch (error) {
      logger.error(`Erro ao tratar seleção de profissional: ${error.message}`);
      
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao listar os profissionais. Por favor, tente novamente ou entre em contato por telefone.`
      );
    }
  }

  /**
   * Tratar seleção de data
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   * @param {Object} entities - Entidades extraídas
   * @param {Object} sessionData - Dados da sessão
   */
  async handleDateSelection(client, establishment, entities, sessionData) {
    try {
      // Verificar se temos o serviço e profissional selecionados
      if (!sessionData.selectedService || !sessionData.selectedProfessional) {
        // Voltar para o início do fluxo
        sessionData.bookingState = 'service_selection';
        
        await WhatsappSession.update(
          { session_data: sessionData },
          { where: { client_id: client.id, establishment_id: establishment.id } }
        );
        
        return await this.handleServiceSelection(client, establishment, entities, sessionData);
      }
      
      // Verificar se já identificou a data nas entidades
      let selectedDate = null;
      
      if (entities.date) {
        selectedDate = this.parseDate(entities.date);
      }
      
      if (selectedDate) {
        // Verificar se a data é válida (não é no passado e o estabelecimento funciona nesse dia)
        const today = moment().startOf('day');
        const selectedMoment = moment(selectedDate).startOf('day');
        
        // Verificar se é data futura
        if (selectedMoment.isBefore(today)) {
          return await this.sendTextMessage(
            client.phone,
            establishment.phone,
            `Por favor, selecione uma data futura para o agendamento.`
          );
        }
        
        // Verificar se o estabelecimento funciona nesse dia
        const dayOfWeek = selectedMoment.day(); // 0 = Domingo, 1 = Segunda, etc.
        const workingDays = establishment.working_days ? establishment.working_days.split(',').map(day => parseInt(day)) : [];
        
        if (!workingDays.includes(dayOfWeek)) {
          return await this.sendTextMessage(
            client.phone,
            establishment.phone,
            `Desculpe, não funcionamos nesse dia. Por favor, escolha outra data.`
          );
        }
        
        // Atualizar sessão com data selecionada
        sessionData.bookingState = 'time_selection';
        sessionData.selectedDate = selectedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        await WhatsappSession.update(
          { session_data: sessionData },
          { where: { client_id: client.id, establishment_id: establishment.id } }
        );
        
        // Avançar para seleção de horário
        return await this.handleTimeSelection(client, establishment, entities, sessionData);
      }
      
      // Gerar próximos 7 dias disponíveis
      const availableDates = [];
      const workingDays = establishment.working_days ? establishment.working_days.split(',').map(day => parseInt(day)) : [];
      
      let currentDate = moment().startOf('day');
      
      while (availableDates.length < 7) {
        // Verificar se o estabelecimento funciona nesse dia
        if (workingDays.includes(currentDate.day())) {
          availableDates.push({
            date: currentDate.format('YYYY-MM-DD'),
            display: currentDate.format('DD/MM/YYYY (ddd)').replace('(Sun)', '(Dom)').replace('(Mon)', '(Seg)')
              .replace('(Tue)', '(Ter)').replace('(Wed)', '(Qua)').replace('(Thu)', '(Qui)')
              .replace('(Fri)', '(Sex)').replace('(Sat)', '(Sáb)')
          });
        }
        
        currentDate.add(1, 'days');
      }
      
      // Preparar botões com próximas datas disponíveis
      const buttons = availableDates.slice(0, 3).map(date => ({
        text: date.display
      }));
      
      // Enviar mensagem com botões para datas
      return await this.sendButtonMessage(
        client.phone,
        establishment.phone,
        "Para qual data você gostaria de agendar?",
        buttons
      );
    } catch (error) {
      logger.error(`Erro ao tratar seleção de data: ${error.message}`);
      
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao processar a data. Por favor, envie a data no formato DD/MM/YYYY ou diga "amanhã", "sábado", etc.`
      );
    }
  }

  /**
   * Tratar seleção de horário
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   * @param {Object} entities - Entidades extraídas
   * @param {Object} sessionData - Dados da sessão
   */
  async handleTimeSelection(client, establishment, entities, sessionData) {
    try {
      // Verificar se temos o serviço, profissional e data selecionados
      if (!sessionData.selectedService || 
          !sessionData.selectedProfessional || 
          !sessionData.selectedDate) {
        
        // Voltar para o início do fluxo
        sessionData.bookingState = 'service_selection';
        
        await WhatsappSession.update(
          { session_data: sessionData },
          { where: { client_id: client.id, establishment_id: establishment.id } }
        );
        
        return await this.handleServiceSelection(client, establishment, entities, sessionData);
      }
      
      // Verificar se já identificou o horário nas entidades
      let selectedTime = null;
      
      if (entities.time) {
        selectedTime = this.parseTime(entities.time);
      }
      
      if (selectedTime) {
        // Verificar se o horário está dentro do funcionamento do estabelecimento
        const openingTime = establishment.opening_time || '08:00:00';
        const closingTime = establishment.closing_time || '18:00:00';
        
        if (selectedTime < openingTime || selectedTime > closingTime) {
          return await this.sendTextMessage(
            client.phone,
            establishment.phone,
            `Desculpe, nosso horário de funcionamento é das ${openingTime.substring(0, 5)} às ${closingTime.substring(0, 5)}. Por favor, escolha outro horário.`
          );
        }
        
        // Verificar disponibilidade do profissional
        const service = await Service.findByPk(sessionData.selectedService);
        
        // Verificar se já existe agendamento para o profissional nesse horário
        const startTime = selectedTime;
        const endTime = moment(`${sessionData.selectedDate} ${startTime}`).add(service.duration, 'minutes').format('HH:mm:00');
        
        const conflictingAppointment = await Appointment.findOne({
          where: {
            professional_id: sessionData.selectedProfessional,
            scheduled_date: sessionData.selectedDate,
            [Op.and]: [
              {
                scheduled_time: {
                  [Op.lt]: endTime
                }
              },
              sequelize.literal(`
                (scheduled_time + (interval '1 minute' * duration)) > '${startTime}'
              `)
            ],
            status_id: {
              [Op.in]: [1, 2, 3, 6] // waiting, confirmed, started, rescheduled
            }
          }
        });
        
        if (conflictingAppointment) {
          return await this.sendTextMessage(
            client.phone,
            establishment.phone,
            `Desculpe, esse horário não está disponível. Por favor, escolha outro horário.`
          );
        }
        
        // Atualizar sessão com horário selecionado
        sessionData.bookingState = 'confirmation';
        sessionData.selectedTime = selectedTime;
        
        await WhatsappSession.update(
          { session_data: sessionData },
          { where: { client_id: client.id, establishment_id: establishment.id } }
        );
        
        // Avançar para confirmação
        return await this.handleBookingSummary(client, establishment, sessionData);
      }
      
      // Buscar horários disponíveis
      const service = await Service.findByPk(sessionData.selectedService);
      const professional = await User.findByPk(sessionData.selectedProfessional);
      
      // Definir horários de início e fim do dia
      const openingTime = establishment.opening_time || '08:00:00';
      const closingTime = establishment.closing_time || '18:00:00';
      
      // Converter para objetos moment para manipulação
      const [openHour, openMinute] = openingTime.split(':').map(num => parseInt(num));
      const [closeHour, closeMinute] = closingTime.split(':').map(num => parseInt(num));
      
      // Gerar horários disponíveis em intervalos de 30 minutos
      const timeSlots = [];
      let currentHour = openHour;
      let currentMinute = openMinute;
      
      while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
        
        // Verificar se este horário + duração do serviço não ultrapassa o horário de fechamento
        const endTime = moment(`${sessionData.selectedDate} ${timeStr}`).add(service.duration, 'minutes');
        const endHour = endTime.hour();
        const endMinute = endTime.minute();
        
        if (endHour < closeHour || (endHour === closeHour && endMinute <= closeMinute)) {
          timeSlots.push(timeStr);
        }
        
        // Avançar 30 minutos
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute -= 60;
        }
      }
      
      // Buscar agendamentos existentes para o dia e profissional
      const existingAppointments = await Appointment.findAll({
        where: {
          professional_id: sessionData.selectedProfessional,
          scheduled_date: sessionData.selectedDate,
          status_id: {
            [Op.in]: [1, 2, 3, 6] // waiting, confirmed, started, rescheduled
          }
        },
        attributes: ['scheduled_time', 'duration']
      });
      
      // Filtrar horários disponíveis (que não conflitam com agendamentos existentes)
      const availableSlots = timeSlots.filter(slot => {
        // Verificar se o horário não conflita com nenhum agendamento existente
        return !existingAppointments.some(appt => {
          const apptStartTime = appt.scheduled_time;
          const apptEndTime = moment(`${sessionData.selectedDate} ${apptStartTime}`).add(appt.duration, 'minutes').format('HH:mm:00');
          
          const slotStartTime = slot;
          const slotEndTime = moment(`${sessionData.selectedDate} ${slotStartTime}`).add(service.duration, 'minutes').format('HH:mm:00');
          
          // Verificar se há sobreposição
          return (
            (slot >= apptStartTime && slot < apptEndTime) ||
            (slotEndTime > apptStartTime && slotEndTime <= apptEndTime) ||
            (slot <= apptStartTime && slotEndTime >= apptEndTime)
          );
        });
      });
      
      if (availableSlots.length === 0) {
        return await this.sendTextMessage(
          client.phone,
          establishment.phone,
          `Desculpe, não há horários disponíveis para esta data. Por favor, escolha outra data.`
        );
      }
      
      // Preparar mensagem com horários disponíveis
      const formattedDate = moment(sessionData.selectedDate).format('DD/MM/YYYY');
      
      // Agrupar horários por período (manhã, tarde, noite)
      const morningSlots = availableSlots.filter(slot => slot < '12:00:00');
      const afternoonSlots = availableSlots.filter(slot => slot >= '12:00:00' && slot < '18:00:00');
      const eveningSlots = availableSlots.filter(slot => slot >= '18:00:00');
      
      const sections = [];
      
      if (morningSlots.length > 0) {
        sections.push({
          title: "Manhã",
          rows: morningSlots.map(slot => ({
            title: slot.substring(0, 5),
            description: `${formattedDate} - ${service.name} com ${professional.name}`,
            rowId: `time_${slot}`
          }))
        });
      }
      
      if (afternoonSlots.length > 0) {
        sections.push({
          title: "Tarde",
          rows: afternoonSlots.map(slot => ({
            title: slot.substring(0, 5),
            description: `${formattedDate} - ${service.name} com ${professional.name}`,
            rowId: `time_${slot}`
          }))
        });
      }
      
      if (eveningSlots.length > 0) {
        sections.push({
          title: "Noite",
          rows: eveningSlots.map(slot => ({
            title: slot.substring(0, 5),
            description: `${formattedDate} - ${service.name} com ${professional.name}`,
            rowId: `time_${slot}`
          }))
        });
      }
      
      // Enviar mensagem com lista de horários disponíveis
      return await this.sendListMessage(
        client.phone,
        establishment.phone,
        `Horários disponíveis para ${formattedDate}:`,
        "Ver horários",
        sections
      );
    } catch (error) {
      logger.error(`Erro ao tratar seleção de horário: ${error.message}`);
      
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao listar os horários disponíveis. Por favor, tente novamente ou entre em contato por telefone.`
      );
    }
  }

  /**
   * Mostrar resumo do agendamento antes da confirmação
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   * @param {Object} sessionData - Dados da sessão
   */
  async handleBookingSummary(client, establishment, sessionData) {
    try {
      // Buscar informações para mostrar resumo
      const service = await Service.findByPk(sessionData.selectedService);
      const professional = await User.findByPk(sessionData.selectedProfessional);
      
      const formattedDate = moment(sessionData.selectedDate).format('DD/MM/YYYY');
      const formattedTime = sessionData.selectedTime.substring(0, 5);
      
      // Montar mensagem de resumo
      const summaryMessage = `
📅 *Resumo do Agendamento*

Serviço: ${service.name}
Profissional: ${professional.name}
Data: ${formattedDate}
Horário: ${formattedTime}
Duração: ${service.duration} minutos
Valor: R$ ${service.price.toFixed(2)}

Deseja confirmar este agendamento?
      `.trim();
      
      // Enviar mensagem com botões para confirmar ou cancelar
      return await this.sendButtonMessage(
        client.phone,
        establishment.phone,
        summaryMessage,
        [
          { text: "Confirmar" },
          { text: "Cancelar" }
        ]
      );
    } catch (error) {
      logger.error(`Erro ao mostrar resumo do agendamento: ${error.message}`);
      
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao processar seu agendamento. Por favor, tente novamente ou entre em contato por telefone.`
      );
    }
  }

  /**
   * Tratar confirmação de agendamento
   * @param {Object} client - Cliente
   * @param {Object} establishment - Estabelecimento
   * @param {Object} sessionData - Dados da sessão
   */
  async handleBookingConfirmation(client, establishment, sessionData) {
    try {
      // Verificar se temos todas as informações necessárias
      if (!sessionData.selectedService || 
          !sessionData.selectedProfessional || 
          !sessionData.selectedDate || 
          !sessionData.selectedTime) {
        
        return await this.sendTextMessage(
          client.phone,
          establishment.phone,
          `Desculpe, não foi possível completar seu agendamento. Por favor, inicie o processo novamente.`
        );
      }
      
      // Buscar informações para criar o agendamento
      const service = await Service.findByPk(sessionData.selectedService);
      const professional = await User.findByPk(sessionData.selectedProfessional);
      
      // Verificar disponibilidade novamente (pode ter sido reservado por outro cliente)
      const startTime = sessionData.selectedTime;
      const endTime = moment(`${sessionData.selectedDate} ${startTime}`).add(service.duration, 'minutes').format('HH:mm:00');
      
      const conflictingAppointment = await Appointment.findOne({
        where: {
          professional_id: sessionData.selectedProfessional,
          scheduled_date: sessionData.selectedDate,
          [Op.and]: [
            {
              scheduled_time: {
                [Op.lt]: endTime
              }
            },
            sequelize.literal(`
              (scheduled_time + (interval '1 minute' * duration)) > '${startTime}'
            `)
          ],
          status_id: {
            [Op.in]: [1, 2, 3, 6] // waiting, confirmed, started, rescheduled
          }
        }
      });
      
      if (conflictingAppointment) {
        return await this.sendTextMessage(
          client.phone,
          establishment.phone,
          `Desculpe, o horário selecionado já foi reservado por outro cliente. Por favor, escolha outro horário.`
        );
      }
      
      // Calcular comissão se aplicável
      let commissionAmount = null;
      
      if (service.has_commission) {
        // Verificar se há comissão personalizada para este profissional
        const professionalService = await ProfessionalService.findOne({
          where: {
            service_id: service.id,
            professional_id: professional.id
          }
        });
        
        const commissionPercentage = professionalService?.custom_commission_percentage || service.commission_percentage;
        
        if (commissionPercentage) {
          commissionAmount = (service.price * commissionPercentage) / 100;
        }
      }
      
      // Criar agendamento
      const appointment = await Appointment.create({
        establishment_id: establishment.id,
        client_id: client.id,
        service_id: service.id,
        professional_id: professional.id,
        status_id: 2, // confirmed
        scheduled_date: sessionData.selectedDate,
        scheduled_time: sessionData.selectedTime,
        duration: service.duration,
        price: service.price,
        commission_amount: commissionAmount,
        notes: "Agendamento realizado via WhatsApp",
        reminder_sent: false,
        confirmation_received: true
      });
      
      // Registrar histórico
      await AppointmentHistory.create({
        appointment_id: appointment.id,
        previous_status_id: null,
        new_status_id: 2, // confirmed
        notes: 'Agendamento criado e confirmado via WhatsApp'
      });
      
      // Registrar mensagem enviada
      await WhatsappMessage.create({
        establishment_id: establishment.id,
        client_id: client.id,
        appointment_id: appointment.id,
        message: 'Confirmação de agendamento',
        direction: 'outgoing',
        message_type: 'text'
      });
      
      // Resetar estado da sessão
      sessionData.bookingState = 'initial';
      sessionData.selectedService = null;
      sessionData.selectedProfessional = null;
      sessionData.selectedDate = null;
      sessionData.selectedTime = null;
      
      await WhatsappSession.update(
        { session_data: sessionData },
        { where: { client_id: client.id, establishment_id: establishment.id } }
      );
      
      // Buscar configurações do estabelecimento
      const settings = await EstablishmentSetting.findOne({
        where: { establishment_id: establishment.id }
      });
      
      // Enviar mensagem de confirmação
      const confirmationMessage = settings?.confirmation_message || 
        `Agendamento confirmado com sucesso!\n\nServiço: ${service.name}\nProfissional: ${professional.name}\nData: ${moment(sessionData.selectedDate).format('DD/MM/YYYY')}\nHorário: ${sessionData.selectedTime.substring(0, 5)}\n\nObrigado pela preferência!`;
      
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        confirmationMessage
      );
    } catch (error) {
      logger.error(`Erro ao confirmar agendamento: ${error.message}`);
      
      return await this.sendTextMessage(
        client.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao confirmar seu agendamento. Por favor, tente novamente ou entre em contato por telefone.`
      );
    }
  }

  /**
   * Enviar confirmação de agendamento (após criação pelo painel)
   * @param {string} clientPhone - Telefone do cliente
   * @param {string} establishmentPhone - Telefone do estabelecimento
   * @param {Object} appointment - Agendamento criado
   */
  async sendAppointmentConfirmation(clientPhone, establishmentPhone, appointment) {
    try {
      // Buscar dados relacionados
      const establishment = await Establishment.findByPk(appointment.establishment_id);
      const service = await Service.findByPk(appointment.service_id);
      const professional = await User.findByPk(appointment.professional_id);
      
      // Formatar data e hora
      const formattedDate = moment(appointment.scheduled_date).format('DD/MM/YYYY');
      const formattedTime = appointment.scheduled_time.substring(0, 5);
      
      // Buscar configurações do estabelecimento
      const settings = await EstablishmentSetting.findOne({
        where: { establishment_id: establishment.id }
      });
      
      // Montar mensagem de confirmação
      const confirmationMessage = settings?.confirmation_message || 
        `Agendamento confirmado com sucesso!\n\nServiço: ${service.name}\nProfissional: ${professional.name}\nData: ${formattedDate}\nHorário: ${formattedTime}\n\nObrigado pela preferência!`;
      
      // Enviar mensagem
      return await this.sendTextMessage(
        clientPhone,
        establishmentPhone,
        confirmationMessage
      );
    } catch (error) {
      logger.error(`Erro ao enviar confirmação de agendamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar atualização de agendamento
   * @param {string} clientPhone - Telefone do cliente
   * @param {string} establishmentPhone - Telefone do estabelecimento
   * @param {Object} appointment - Agendamento atualizado
   */
  async sendAppointmentUpdate(clientPhone, establishmentPhone, appointment) {
    try {
      // Buscar dados relacionados
      const service = await Service.findByPk(appointment.service_id);
      const professional = await User.findByPk(appointment.professional_id);
      
      // Formatar data e hora
      const formattedDate = moment(appointment.scheduled_date).format('DD/MM/YYYY');
      const formattedTime = appointment.scheduled_time.substring(0, 5);
      
      // Montar mensagem de atualização
      const updateMessage = `
📅 *Atualização de Agendamento*

Seu agendamento foi atualizado com os seguintes detalhes:

Serviço: ${service.name}
Profissional: ${professional.name}
Data: ${formattedDate}
Horário: ${formattedTime}
Duração: ${appointment.duration} minutos
Valor: R$ ${appointment.price.toFixed(2)}

Status: ${appointment.status.name}

Obrigado pela preferência!
      `.trim();
      
      // Enviar mensagem
      return await this.sendTextMessage(
        clientPhone,
        establishmentPhone,
        updateMessage
      );
    } catch (error) {
      logger.error(`Erro ao enviar atualização de agendamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar mensagem de cancelamento
   * @param {string} clientPhone - Telefone do cliente
   * @param {string} establishmentPhone - Telefone do estabelecimento
   * @param {Object} appointment - Agendamento cancelado
   * @param {string} reason - Motivo do cancelamento
   */
  async sendCancellationMessage(clientPhone, establishmentPhone, appointment, reason) {
    try {
      // Buscar dados relacionados
      const service = await Service.findByPk(appointment.service_id);
      const professional = await User.findByPk(appointment.professional_id);
      
      // Formatar data e hora
      const formattedDate = moment(appointment.scheduled_date).format('DD/MM/YYYY');
      const formattedTime = appointment.scheduled_time.substring(0, 5);
      
      // Montar mensagem de cancelamento
      let cancelMessage = `
❌ *Agendamento Cancelado*

Informamos que seu agendamento foi cancelado:

Serviço: ${service.name}
Profissional: ${professional.name}
Data: ${formattedDate}
Horário: ${formattedTime}
      `.trim();
      
      if (reason) {
        cancelMessage += `\n\nMotivo: ${reason}`;
      }
      
      cancelMessage += '\n\nSe desejar reagendar, por favor entre em contato conosco.';
      
      // Enviar mensagem
      return await this.sendTextMessage(
        clientPhone,
        establishmentPhone,
        cancelMessage
      );
    } catch (error) {
      logger.error(`Erro ao enviar mensagem de cancelamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar atualização de status
   * @param {string} clientPhone - Telefone do cliente
   * @param {string} establishmentPhone - Telefone do estabelecimento
   * @param {string} message - Mensagem de atualização
   * @param {Object} appointment - Agendamento
   */
  async sendStatusUpdate(clientPhone, establishmentPhone, message, appointment) {
    try {
      // Buscar dados relacionados
      const service = await Service.findByPk(appointment.service_id);
      const professional = await User.findByPk(appointment.professional_id);
      
      // Formatar data e hora
      const formattedDate = moment(appointment.scheduled_date).format('DD/MM/YYYY');
      const formattedTime = appointment.scheduled_time.substring(0, 5);
      
      // Montar mensagem de atualização
      const updateMessage = `
🔔 *Atualização de Status*

${message}

Serviço: ${service.name}
Profissional: ${professional.name}
Data: ${formattedDate}
Horário: ${formattedTime}
      `.trim();
      
      // Enviar mensagem
      return await this.sendTextMessage(
        clientPhone,
        establishmentPhone,
        updateMessage
      );
    } catch (error) {
      logger.error(`Erro ao enviar atualização de status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar lembrete de agendamento
   * @param {string} clientPhone - Telefone do cliente
   * @param {string} establishmentPhone - Telefone do estabelecimento
   * @param {Object} appointment - Agendamento
   */
  async sendReminderMessage(clientPhone, establishmentPhone, appointment) {
    try {
      // Buscar dados relacionados
      const establishment = await Establishment.findByPk(appointment.establishment_id);
      const service = await Service.findByPk(appointment.service_id);
      const professional = await User.findByPk(appointment.professional_id);
      
      // Formatar data e hora
      const formattedDate = moment(appointment.scheduled_date).format('DD/MM/YYYY');
      const formattedTime = appointment.scheduled_time.substring(0, 5);
      
      // Buscar configurações do estabelecimento
      const settings = await EstablishmentSetting.findOne({
        where: { establishment_id: establishment.id }
      });
      
      // Montar mensagem de lembrete
      const reminderBase = settings?.reminder_message || 
        `Lembrete: Você tem um agendamento hoje na ${establishment.name}. Confirma sua presença?`;
      
      const reminderMessage = `
🔔 *Lembrete de Agendamento*

${reminderBase}

Serviço: ${service.name}
Profissional: ${professional.name}
Data: ${formattedDate}
Horário: ${formattedTime}

Por favor, confirme sua presença respondendo "Confirmo" ou "Cancelar".
      `.trim();
      
      // Enviar mensagem com botões
      return await this.sendButtonMessage(
        clientPhone,
        establishmentPhone,
        reminderMessage,
        [
          { text: "Confirmo" },
          { text: "Cancelar" },
          { text: "Remarcar" }
        ]
      );
    } catch (error) {
      logger.error(`Erro ao enviar lembrete de agendamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar agenda do dia para profissional
   * @param {Object} professional - Profissional
   * @param {Object} establishment - Estabelecimento
   */
  async sendProfessionalSchedule(professional, establishment) {
    try {
      // Buscar agendamentos do dia para o profissional
      const today = moment().format('YYYY-MM-DD');
      
      const appointments = await Appointment.findAll({
        where: {
          professional_id: professional.id,
          scheduled_date: today,
          status_id: {
            [Op.in]: [1, 2, 3, 6] // waiting, confirmed, started, rescheduled
          }
        },
        include: [
          { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
          { model: Service, as: 'service', attributes: ['id', 'name', 'duration'] },
          { model: AppointmentStatus, as: 'status', attributes: ['id', 'name'] }
        ],
        order: [['scheduled_time', 'ASC']]
      });
      
      if (appointments.length === 0) {
        return await this.sendTextMessage(
          professional.phone,
          establishment.phone,
          `Olá ${professional.name}! Você não tem agendamentos para hoje.`
        );
      }
      
      // Montar mensagem com lista de agendamentos
      let scheduleMessage = `
📅 *Sua Agenda de Hoje (${moment().format('DD/MM/YYYY')})*

Olá ${professional.name}! Aqui está sua agenda para hoje:
      `.trim();
      
      appointments.forEach((appointment, index) => {
        const startTime = appointment.scheduled_time.substring(0, 5);
        const endTime = moment(`${today} ${appointment.scheduled_time}`).add(appointment.service.duration, 'minutes').format('HH:mm');
        
        scheduleMessage += `\n\n${index + 1}. ${startTime} - ${endTime}`;
        scheduleMessage += `\nCliente: ${appointment.client.name}`;
        scheduleMessage += `\nServiço: ${appointment.service.name}`;
        scheduleMessage += `\nStatus: ${appointment.status.name}`;
      });
      
      // Enviar mensagem
      return await this.sendTextMessage(
        professional.phone,
        establishment.phone,
        scheduleMessage
      );
    } catch (error) {
      logger.error(`Erro ao enviar agenda do profissional: ${error.message}`);
      
      // Fallback para mensagem simples
      return await this.sendTextMessage(
        professional.phone,
        establishment.phone,
        `Desculpe, tivemos um problema ao buscar sua agenda. Por favor, verifique no painel administrativo.`
      );
    }
  }

  /**
   * Analisar data em formato de texto
   * @param {string} dateText - Texto contendo data
   * @returns {Date|null} - Data analisada ou null se inválida
   */
  parseDate(dateText) {
    try {
      // Normalizar texto
      const text = dateText.toLowerCase().trim();
      
      // Data atual para referência
      const today = moment();
      
      // Verificar palavras-chave comuns
      if (text === 'hoje') {
        return today.toDate();
      } else if (text === 'amanhã' || text === 'amanha') {
        return today.add(1, 'day').toDate();
      } else if (text === 'depois de amanhã' || text === 'depois de amanha') {
        return today.add(2, 'days').toDate();
      }
      
      // Verificar dias da semana
      const weekdays = {
        'domingo': 0,
        'segunda': 1, 'segunda-feira': 1, 'segunda feira': 1,
        'terça': 2, 'terca': 2, 'terça-feira': 2, 'terca-feira': 2, 'terça feira': 2, 'terca feira': 2,
        'quarta': 3, 'quarta-feira': 3, 'quarta feira': 3,
        'quinta': 4, 'quinta-feira': 4, 'quinta feira': 4,
        'sexta': 5, 'sexta-feira': 5, 'sexta feira': 5,
        'sábado': 6, 'sabado': 6
      };
      
      for (const [weekday, value] of Object.entries(weekdays)) {
        if (text.includes(weekday)) {
          const targetDay = value;
          const currentDay = today.day();
          
          // Calcular dias para adicionar
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) {
            daysToAdd += 7; // Próxima semana
          }
          
          return today.add(daysToAdd, 'days').toDate();
        }
      }
      
      // Tentar formatos de data comuns
      const formats = [
        'DD/MM/YYYY', 'D/M/YYYY', 'DD/MM/YY', 'D/M/YY',
        'DD/MM', 'D/M',
        'YYYY-MM-DD', 'YY-MM-DD'
      ];
      
      // Tentar converter usando os formatos
      for (const format of formats) {
        const date = moment(text, format);
        
        if (date.isValid()) {
          // Se o formato não incluir ano, assumir ano atual
          if (!format.includes('Y')) {
            date.year(today.year());
          } else if (format.includes('YY') && !format.includes('YYYY')) {
            // Se for formato com 2 dígitos para o ano, ajustar para século atual
            const fullYear = date.year();
            if (fullYear < 100) {
              date.year(2000 + fullYear);
            }
          }
          
          return date.toDate();
        }
      }
      
      // Tentar extrair data no formato DD/MM
      const ddmmRegex = /(\d{1,2})[\/\-\.](\d{1,2})/;
      const ddmmMatch = text.match(ddmmRegex);
      
      if (ddmmMatch) {
        const day = parseInt(ddmmMatch[1]);
        const month = parseInt(ddmmMatch[2]) - 1; // Mês em JS é 0-indexed
        
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
          const date = moment();
          date.date(day);
          date.month(month);
          
          // Se a data já passou este ano, assumir próximo ano
          if (date.isBefore(today)) {
            date.add(1, 'year');
          }
          
          return date.toDate();
        }
      }
      
      // Se chegou até aqui, não conseguiu analisar a data
      return null;
    } catch (error) {
      logger.error(`Erro ao analisar data: ${error.message}`);
      return null;
    }
  }

  /**
   * Analisar hora em formato de texto
   * @param {string} timeText - Texto contendo hora
   * @returns {string|null} - Hora no formato HH:MM:00 ou null se inválida
   */
  parseTime(timeText) {
    try {
      // Normalizar texto
      const text = timeText.toLowerCase().trim().replace('h', ':').replace('hs', ':');
      
      // Verificar formato HH:MM
      const hhmmRegex = /(\d{1,2})[:\.]?(\d{2})?/;
      const hhmmMatch = text.match(hhmmRegex);
      
      if (hhmmMatch) {
        const hour = parseInt(hhmmMatch[1]);
        const minute = parseInt(hhmmMatch[2] || '0');
        
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        }
      }
      
      // Verificar número simples para hora
      const hourRegex = /^(\d{1,2})$/;
      const hourMatch = text.match(hourRegex);
      
      if (hourMatch) {
        const hour = parseInt(hourMatch[1]);
        
        if (hour >= 0 && hour <= 23) {
          return `${hour.toString().padStart(2, '0')}:00:00`;
        }
      }
      
      // Se chegou até aqui, não conseguiu analisar a hora
      return null;
    } catch (error) {
      logger.error(`Erro ao analisar hora: ${error.message}`);
      return null;
    }
  }
}

module.exports = new WhatsappService();
