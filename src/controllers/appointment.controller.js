// src/controllers/appointment.controller.js
const { 
  Appointment, 
  AppointmentStatus, 
  AppointmentHistory, 
  Client,
  Service,
  User,
  Establishment,
  WhatsappMessage
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const whatsappService = require('../services/whatsapp.service');

class AppointmentController {
  /**
   * Listar agendamentos por estabelecimento e filtros
   */
  static async findByEstablishment(req, res) {
    try {
      const { establishmentId } = req.params;
      const { 
        startDate, endDate, statusId, professionalId,
        clientId, serviceId
      } = req.query;
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== parseInt(establishmentId)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Construir filtros
      const where = {
        establishment_id: establishmentId
      };
      
      // Filtro por data
      if (startDate && endDate) {
        where.scheduled_date = {
          [Op.between]: [startDate, endDate]
        };
      } else if (startDate) {
        where.scheduled_date = {
          [Op.gte]: startDate
        };
      } else if (endDate) {
        where.scheduled_date = {
          [Op.lte]: endDate
        };
      }
      
      // Filtro por status
      if (statusId) {
        where.status_id = statusId;
      }
      
      // Filtro por profissional
      if (professionalId) {
        where.professional_id = professionalId;
      }
      
      // Filtro por cliente
      if (clientId) {
        where.client_id = clientId;
      }
      
      // Filtro por serviço
      if (serviceId) {
        where.service_id = serviceId;
      }
      
      // Buscar agendamentos
      const appointments = await Appointment.findAll({
        where,
        include: [
          { model: AppointmentStatus, as: 'status' },
          { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
          { model: Service, as: 'service', attributes: ['id', 'name', 'duration'] },
          { 
            model: User, 
            as: 'professional', 
            attributes: ['id', 'name', 'phone']
          }
        ],
        order: [
          ['scheduled_date', 'ASC'],
          ['scheduled_time', 'ASC']
        ]
      });
      
      return res.status(200).json(appointments);
    } catch (error) {
      logger.error(`Erro ao listar agendamentos: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar agendamentos' });
    }
  }
  
  /**
   * Buscar agendamento por ID
   */
  static async findById(req, res) {
    try {
      const { id } = req.params;
      
      const appointment = await Appointment.findByPk(id, {
        include: [
          { model: AppointmentStatus, as: 'status' },
          { model: Client, as: 'client' },
          { model: Service, as: 'service' },
          { model: User, as: 'professional' },
          { model: AppointmentHistory, as: 'history', include: [
            { model: AppointmentStatus, as: 'previousStatus' },
            { model: AppointmentStatus, as: 'newStatus' },
            { model: User, as: 'changedBy', attributes: ['id', 'name'] }
          ]}
        ]
      });
      
      if (!appointment) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== appointment.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      return res.status(200).json(appointment);
    } catch (error) {
      logger.error(`Erro ao buscar agendamento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar agendamento' });
    }
  }
  
  /**
   * Criar novo agendamento
   */
  static async create(req, res) {
    try {
      const {
        establishment_id, client_id, service_id, professional_id,
        scheduled_date, scheduled_time, notes
      } = req.body;
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Verificar se o cliente existe
      const client = await Client.findOne({
        where: {
          id: client_id,
          establishment_id
        }
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      // Verificar se o serviço existe
      const service = await Service.findOne({
        where: {
          id: service_id,
          establishment_id,
          active: true
        }
      });
      
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      // Verificar se o profissional existe
      const professional = await User.findOne({
        where: {
          id: professional_id,
          establishment_id,
          role_id: 3, // 3 = professional
          active: true
        }
      });
      
      if (!professional) {
        return res.status(404).json({ message: 'Profissional não encontrado' });
      }
      
      // Verificar se o profissional oferece o serviço
      const professionalOffersService = await ProfessionalService.findOne({
        where: {
          professional_id,
          service_id
        }
      });
      
      if (!professionalOffersService) {
        return res.status(400).json({ message: 'Este profissional não oferece o serviço selecionado' });
      }
      
      // Verificar disponibilidade do profissional
      const startTime = new Date(`${scheduled_date}T${scheduled_time}`);
      const endTime = new Date(startTime.getTime() + service.duration * 60000);
      
      // Converter para strings de hora para comparação no banco
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:00`;
      
      // Verificar se já existe agendamento para o profissional nesse horário
      const conflictingAppointment = await Appointment.findOne({
        where: {
          professional_id,
          scheduled_date,
          [Op.and]: [
            {
              scheduled_time: {
                [Op.lt]: endTimeStr
              }
            },
            sequelize.literal(`
              (scheduled_time + (interval '1 minute' * duration)) > '${scheduled_time}'
            `)
          ],
          status_id: {
            [Op.in]: [1, 2, 3] // waiting, confirmed, started
          }
        }
      });
      
      if (conflictingAppointment) {
        return res.status(400).json({ message: 'Horário indisponível para o profissional selecionado' });
      }
      
      // Calcular comissão se aplicável
      let commissionAmount = null;
      
      if (service.has_commission) {
        // Verificar se há comissão personalizada para este profissional
        const commissionPercentage = professionalOffersService.custom_commission_percentage || service.commission_percentage;
        
        if (commissionPercentage) {
          commissionAmount = (service.price * commissionPercentage) / 100;
        }
      }
      
      // Criar agendamento
      const appointment = await Appointment.create({
        establishment_id,
        client_id,
        service_id,
        professional_id,
        status_id: 1, // 1 = waiting
        scheduled_date,
        scheduled_time,
        duration: service.duration,
        price: service.price,
        commission_amount: commissionAmount,
        notes,
        reminder_sent: false,
        confirmation_received: false
      });
      
      // Registrar histórico
      await AppointmentHistory.create({
        appointment_id: appointment.id,
        previous_status_id: null,
        new_status_id: 1, // 1 = waiting
        changed_by: req.user.id,
        notes: 'Agendamento criado'
      });
      
      // Buscar agendamento com relacionamentos
      const createdAppointment = await Appointment.findByPk(appointment.id, {
        include: [
          { model: AppointmentStatus, as: 'status' },
          { model: Client, as: 'client' },
          { model: Service, as: 'service' },
          { model: User, as: 'professional' }
        ]
      });
      
      // Enviar mensagem de confirmação para o cliente
      const establishment = await Establishment.findByPk(establishment_id);
      
      try {
        await whatsappService.sendAppointmentConfirmation(
          client.phone,
          establishment.phone,
          createdAppointment
        );
        
        // Registrar mensagem enviada
        await WhatsappMessage.create({
          establishment_id,
          client_id,
          appointment_id: appointment.id,
          message: 'Mensagem de confirmação de agendamento',
          direction: 'outgoing',
          message_type: 'text'
        });
      } catch (error) {
        logger.error(`Erro ao enviar mensagem de confirmação: ${error.message}`);
        // Não impede a criação do agendamento
      }
      
      return res.status(201).json(createdAppointment);
    } catch (error) {
      logger.error(`Erro ao criar agendamento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao criar agendamento' });
    }
  }
  
  /**
   * Atualizar status do agendamento
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status_id, notes } = req.body;
      
      const appointment = await Appointment.findByPk(id, {
        include: [
          { model: AppointmentStatus, as: 'status' },
          { model: Client, as: 'client' },
          { model: Service, as: 'service' },
          { model: User, as: 'professional' },
          { model: Establishment, as: 'establishment' }
        ]
      });
      
      if (!appointment) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== appointment.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Verificar se o status existe
      const newStatus = await AppointmentStatus.findByPk(status_id);
      
      if (!newStatus) {
        return res.status(404).json({ message: 'Status não encontrado' });
      }
      
      // Registrar status anterior
      const previousStatusId = appointment.status_id;
      
      // Atualizar status
      appointment.status_id = status_id;
      
      // Atualizar confirmação se status for 'confirmed'
      if (status_id === 2) { // 2 = confirmed
        appointment.confirmation_received = true;
      }
      
      await appointment.save();
      
      // Registrar histórico
      await AppointmentHistory.create({
        appointment_id: id,
        previous_status_id: previousStatusId,
        new_status_id: status_id,
        changed_by: req.user.id,
        notes: notes || `Status atualizado para ${newStatus.name}`
      });
      
      // Enviar mensagem ao cliente conforme status
      try {
        switch (status_id) {
          case 2: // confirmed
            await whatsappService.sendStatusUpdate(
              appointment.client.phone,
              appointment.establishment.phone,
              'Seu agendamento foi confirmado!',
              appointment
            );
            break;
          case 3: // started
            await whatsappService.sendStatusUpdate(
              appointment.client.phone,
              appointment.establishment.phone,
              'Seu atendimento foi iniciado.',
              appointment
            );
            break;
          case 4: // completed
            await whatsappService.sendStatusUpdate(
              appointment.client.phone,
              appointment.establishment.phone,
              'Seu atendimento foi concluído. Obrigado pela preferência!',
              appointment
            );
            break;
          case 5: // cancelled
            await whatsappService.sendStatusUpdate(
              appointment.client.phone,
              appointment.establishment.phone,
              'Seu agendamento foi cancelado. Entre em contato para mais informações.',
              appointment
            );
            break;
          case 6: // rescheduled
            await whatsappService.sendStatusUpdate(
              appointment.client.phone,
              appointment.establishment.phone,
              'Seu agendamento foi remarcado. Confira os novos detalhes.',
              appointment
            );
            break;
        }
        
        // Registrar mensagem enviada
        await WhatsappMessage.create({
          establishment_id: appointment.establishment_id,
          client_id: appointment.client_id,
          appointment_id: appointment.id,
          message: `Atualização de status: ${newStatus.name}`,
          direction: 'outgoing',
          message_type: 'text'
        });
      } catch (error) {
        logger.error(`Erro ao enviar mensagem de atualização: ${error.message}`);
        // Não impede a atualização do status
      }
      
      // Buscar agendamento atualizado
      const updatedAppointment = await Appointment.findByPk(id, {
        include: [
          { model: AppointmentStatus, as: 'status' },
          { model: Client, as: 'client' },
          { model: Service, as: 'service' },
          { model: User, as: 'professional' }
        ]
      });
      
      return res.status(200).json(updatedAppointment);
    } catch (error) {
      logger.error(`Erro ao atualizar status do agendamento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao atualizar status do agendamento' });
    }
  }
  
  /**
   * Atualizar agendamento
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        service_id, professional_id, scheduled_date,
        scheduled_time, notes
      } = req.body;
      
      const appointment = await Appointment.findByPk(id);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== appointment.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Dados originais para verificar o que mudou
      const originalData = {
        service_id: appointment.service_id,
        professional_id: appointment.professional_id,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time
      };
      
      // Verificar serviço se for alterado
      if (service_id && service_id !== appointment.service_id) {
        const service = await Service.findOne({
          where: {
            id: service_id,
            establishment_id: appointment.establishment_id,
            active: true
          }
        });
        
        if (!service) {
          return res.status(404).json({ message: 'Serviço não encontrado' });
        }
        
        appointment.service_id = service_id;
        appointment.duration = service.duration;
        appointment.price = service.price;
        
        // Recalcular comissão se aplicável
        if (service.has_commission) {
          const professionalService = await ProfessionalService.findOne({
            where: {
              service_id,
              professional_id: appointment.professional_id
            }
          });
          
          if (professionalService) {
            const commissionPercentage = professionalService.custom_commission_percentage || service.commission_percentage;
            appointment.commission_amount = (service.price * commissionPercentage) / 100;
          } else {
            appointment.commission_amount = null;
          }
        } else {
          appointment.commission_amount = null;
        }
      }
      
      // Verificar profissional se for alterado
      if (professional_id && professional_id !== appointment.professional_id) {
        const professional = await User.findOne({
          where: {
            id: professional_id,
            establishment_id: appointment.establishment_id,
            role_id: 3, // 3 = professional
            active: true
          }
        });
        
        if (!professional) {
          return res.status(404).json({ message: 'Profissional não encontrado' });
        }
        
        // Verificar se o profissional oferece o serviço
        const professionalOffersService = await ProfessionalService.findOne({
          where: {
            professional_id,
            service_id: appointment.service_id
          }
        });
        
        if (!professionalOffersService) {
          return res.status(400).json({ message: 'Este profissional não oferece o serviço selecionado' });
        }
        
        appointment.professional_id = professional_id;
        
        // Recalcular comissão se aplicável
        const service = await Service.findByPk(appointment.service_id);
        
        if (service.has_commission) {
          const commissionPercentage = professionalOffersService.custom_commission_percentage || service.commission_percentage;
          appointment.commission_amount = (service.price * commissionPercentage) / 100;
        }
      }
      
      // Verificar data e hora se forem alteradas
      if ((scheduled_date && scheduled_date !== appointment.scheduled_date) ||
          (scheduled_time && scheduled_time !== appointment.scheduled_time)) {
        
        // Atualizar data e hora
        if (scheduled_date) appointment.scheduled_date = scheduled_date;
        if (scheduled_time) appointment.scheduled_time = scheduled_time;
        
        // Verificar disponibilidade do profissional
        const service = await Service.findByPk(appointment.service_id);
        const startTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);
        
        // Converter para strings de hora para comparação no banco
        const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:00`;
        
        // Verificar se já existe outro agendamento para o profissional nesse horário
        const conflictingAppointment = await Appointment.findOne({
          where: {
            id: { [Op.ne]: id }, // excluir o próprio agendamento
            professional_id: appointment.professional_id,
            scheduled_date: appointment.scheduled_date,
            [Op.and]: [
              {
                scheduled_time: {
                  [Op.lt]: endTimeStr
                }
              },
              sequelize.literal(`
                (scheduled_time + (interval '1 minute' * duration)) > '${appointment.scheduled_time}'
              `)
            ],
            status_id: {
              [Op.in]: [1, 2, 3] // waiting, confirmed, started
            }
          }
        });
        
        if (conflictingAppointment) {
          return res.status(400).json({ message: 'Horário indisponível para o profissional selecionado' });
        }
        
        // Se for remarcação, atualizar status para "remarcado"
        if (appointment.status_id !== 6 && // 6 = rescheduled
            (scheduled_date !== originalData.scheduled_date || scheduled_time !== originalData.scheduled_time)) {
          appointment.status_id = 6;
          
          // Registrar histórico de remarcação
          await AppointmentHistory.create({
            appointment_id: id,
            previous_status_id: appointment.status_id,
            new_status_id: 6,
            changed_by: req.user.id,
            notes: 'Agendamento remarcado'
          });
        }
      }
      
      // Atualizar notas
      if (notes !== undefined) {
        appointment.notes = notes;
      }
      
      await appointment.save();
      
      // Buscar agendamento atualizado
      const updatedAppointment = await Appointment.findByPk(id, {
        include: [
          { model: AppointmentStatus, as: 'status' },
          { model: Client, as: 'client' },
          { model: Service, as: 'service' },
          { model: User, as: 'professional' }
        ]
      });
      
      // Enviar mensagem de atualização ao cliente se houver alterações significativas
      if (
        service_id !== originalData.service_id ||
        professional_id !== originalData.professional_id ||
        scheduled_date !== originalData.scheduled_date ||
        scheduled_time !== originalData.scheduled_time
      ) {
        try {
          const client = await Client.findByPk(appointment.client_id);
          const establishment = await Establishment.findByPk(appointment.establishment_id);
          
          await whatsappService.sendAppointmentUpdate(
            client.phone,
            establishment.phone,
            updatedAppointment
          );
          
          // Registrar mensagem enviada
          await WhatsappMessage.create({
            establishment_id: appointment.establishment_id,
            client_id: appointment.client_id,
            appointment_id: appointment.id,
            message: 'Atualização de agendamento',
            direction: 'outgoing',
            message_type: 'text'
          });
        } catch (error) {
          logger.error(`Erro ao enviar mensagem de atualização: ${error.message}`);
          // Não impede a atualização do agendamento
        }
      }
      
      return res.status(200).json(updatedAppointment);
    } catch (error) {
      logger.error(`Erro ao atualizar agendamento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao atualizar agendamento' });
    }
  }
  
  /**
   * Cancelar agendamento
   */
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const { cancellation_reason } = req.body;
      
      const appointment = await Appointment.findByPk(id, {
        include: [
          { model: Client, as: 'client' },
          { model: Establishment, as: 'establishment' }
        ]
      });
      
      if (!appointment) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== appointment.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Verificar se o agendamento já está cancelado
      if (appointment.status_id === 5) { // 5 = cancelled
        return res.status(400).json({ message: 'Agendamento já está cancelado' });
      }
      
      // Verificar se o agendamento já foi concluído
      if (appointment.status_id === 4) { // 4 = completed
        return res.status(400).json({ message: 'Não é possível cancelar um agendamento concluído' });
      }
      
      // Registrar status anterior
      const previousStatusId = appointment.status_id;
      
      // Atualizar status para cancelado
      appointment.status_id = 5; // 5 = cancelled
      await appointment.save();
      
      // Registrar histórico
      await AppointmentHistory.create({
        appointment_id: id,
        previous_status_id: previousStatusId,
        new_status_id: 5, // 5 = cancelled
        changed_by: req.user.id,
        notes: cancellation_reason || 'Agendamento cancelado'
      });
      
      // Enviar mensagem de cancelamento ao cliente
      try {
        await whatsappService.sendCancellationMessage(
          appointment.client.phone,
          appointment.establishment.phone,
          appointment,
          cancellation_reason
        );
        
        // Registrar mensagem enviada
        await WhatsappMessage.create({
          establishment_id: appointment.establishment_id,
          client_id: appointment.client_id,
          appointment_id: appointment.id,
          message: 'Cancelamento de agendamento',
          direction: 'outgoing',
          message_type: 'text'
        });
      } catch (error) {
        logger.error(`Erro ao enviar mensagem de cancelamento: ${error.message}`);
        // Não impede o cancelamento do agendamento
      }
      
      // Buscar agendamento atualizado
      const cancelledAppointment = await Appointment.findByPk(id, {
        include: [
          { model: AppointmentStatus, as: 'status' },
          { model: Client, as: 'client' },
          { model: Service, as: 'service' },
          { model: User, as: 'professional' }
        ]
      });
      
      return res.status(200).json(cancelledAppointment);
    } catch (error) {
      logger.error(`Erro ao cancelar agendamento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao cancelar agendamento' });
    }
  }
  
  /**
   * Buscar disponibilidade de horários para agendamento
   */
  static async getAvailability(req, res) {
    try {
      const { establishmentId } = req.params;
      const { date, serviceId, professionalId } = req.query;
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== parseInt(establishmentId)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Verificar se a data foi fornecida
      if (!date) {
        return res.status(400).json({ message: 'Data é obrigatória' });
      }
      
      // Buscar estabelecimento para verificar horário de funcionamento
      const establishment = await Establishment.findByPk(establishmentId);
      
      if (!establishment) {
        return res.status(404).json({ message: 'Estabelecimento não encontrado' });
      }
      
      // Verificar dia da semana da data
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Segunda, etc.
      
      // Verificar se o estabelecimento funciona nesse dia
      const workingDays = establishment.working_days ? establishment.working_days.split(',').map(day => parseInt(day)) : [];
      
      if (!workingDays.includes(dayOfWeek)) {
        return res.status(400).json({ message: 'Estabelecimento não funciona neste dia' });
      }
      
      // Definir horários de início e fim do dia
      const openingTime = establishment.opening_time || '08:00:00';
      const closingTime = establishment.closing_time || '18:00:00';
      
      // Converter para objetos Date para manipulação
      const [openHour, openMinute] = openingTime.split(':').map(num => parseInt(num));
      const [closeHour, closeMinute] = closingTime.split(':').map(num => parseInt(num));
      
      // Buscar duração do serviço
      let serviceDuration = 30; // Duração padrão em minutos
      
      if (serviceId) {
        const service = await Service.findByPk(serviceId);
        if (service) {
          serviceDuration = service.duration;
        }
      }
      
      // Gerar horários disponíveis em intervalos de 30 minutos
      const timeSlots = [];
      let currentHour = openHour;
      let currentMinute = openMinute;
      
      while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
        
        // Verificar se este horário + duração do serviço não ultrapassa o horário de fechamento
        const endTimeObj = new Date(dateObj);
        endTimeObj.setHours(currentHour, currentMinute + serviceDuration, 0);
        
        const endHour = endTimeObj.getHours();
        const endMinute = endTimeObj.getMinutes();
        
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
      
      // Buscar agendamentos existentes para o dia
      const existingAppointments = await Appointment.findAll({
        where: {
          establishment_id: establishmentId,
          scheduled_date: date,
          status_id: {
            [Op.in]: [1, 2, 3, 6] // waiting, confirmed, started, rescheduled
          },
          ...(professionalId ? { professional_id: professionalId } : {})
        },
        attributes: ['scheduled_time', 'duration', 'professional_id']
      });
      
      // Se não foi especificado um profissional, buscar todos os profissionais disponíveis
      let professionals = [];
      
      if (!professionalId) {
        // Buscar todos os profissionais ativos do estabelecimento
        const allProfessionals = await User.findAll({
          where: {
            establishment_id: establishmentId,
            role_id: 3, // 3 = professional
            active: true
          },
          attributes: ['id', 'name']
        });
        
        // Se foi especificado um serviço, filtrar profissionais que oferecem esse serviço
        if (serviceId) {
          const professionalServices = await ProfessionalService.findAll({
            where: { service_id: serviceId },
            attributes: ['professional_id']
          });
          
          const professionalIds = professionalServices.map(ps => ps.professional_id);
          
          professionals = allProfessionals.filter(prof => professionalIds.includes(prof.id));
        } else {
          professionals = allProfessionals;
        }
      } else {
        // Buscar apenas o profissional especificado
        const professional = await User.findOne({
          where: {
            id: professionalId,
            establishment_id: establishmentId,
            role_id: 3, // 3 = professional
            active: true
          },
          attributes: ['id', 'name']
        });
        
        if (professional) {
          professionals = [professional];
        }
      }
      
      // Calcular horários disponíveis para cada profissional
      const availability = {};
      
      professionals.forEach(professional => {
        // Filtrar agendamentos do profissional
        const profAppointments = existingAppointments.filter(
          appt => appt.professional_id === professional.id
        );
        
        // Calcular horários disponíveis
        const availableSlots = timeSlots.filter(slot => {
          // Verificar se o horário não conflita com nenhum agendamento existente
          return !profAppointments.some(appt => {
            const apptStartTime = appt.scheduled_time;
            const apptEndTime = new Date(`${date}T${appt.scheduled_time}`);
            apptEndTime.setMinutes(apptEndTime.getMinutes() + appt.duration);
            const apptEndTimeStr = `${apptEndTime.getHours().toString().padStart(2, '0')}:${apptEndTime.getMinutes().toString().padStart(2, '0')}:00`;
            
            const slotStartTime = new Date(`${date}T${slot}`);
            const slotEndTime = new Date(slotStartTime);
            slotEndTime.setMinutes(slotEndTime.getMinutes() + serviceDuration);
            const slotEndTimeStr = `${slotEndTime.getHours().toString().padStart(2, '0')}:${slotEndTime.getMinutes().toString().padStart(2, '0')}:00`;
            
            // Verificar se há sobreposição
            return (
              (slot >= apptStartTime && slot < apptEndTimeStr) ||
              (slotEndTimeStr > apptStartTime && slotEndTimeStr <= apptEndTimeStr) ||
              (slot <= apptStartTime && slotEndTimeStr >= apptEndTimeStr)
            );
          });
        });
        
        availability[professional.id] = {
          professional: {
            id: professional.id,
            name: professional.name
          },
          available_slots: availableSlots
        };
      });
      
      return res.status(200).json({
        date,
        establishment: {
          id: establishment.id,
          name: establishment.name
        },
        service_duration: serviceDuration,
        availability
      });
    } catch (error) {
      logger.error(`Erro ao buscar disponibilidade: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar disponibilidade de horários' });
    }
  }
}

module.exports = AppointmentController;
