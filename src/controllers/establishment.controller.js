// src/controllers/establishment.controller.js
const { 
  Establishment, 
  EstablishmentSetting, 
  User, 
  ServiceCategory,
  Service
} = require('../models');
const logger = require('../config/logger');

class EstablishmentController {
  /**
   * Listar todos os estabelecimentos (apenas para super admin)
   */
  static async findAll(req, res) {
    try {
      const establishments = await Establishment.findAll({
        include: [
          { model: EstablishmentSetting, as: 'settings' }
        ]
      });
      
      return res.status(200).json(establishments);
    } catch (error) {
      logger.error(`Erro ao listar estabelecimentos: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar estabelecimentos' });
    }
  }
  
  /**
   * Buscar estabelecimento por ID
   */
  static async findById(req, res) {
    try {
      const { id } = req.params;
      
      const establishment = await Establishment.findByPk(id, {
        include: [
          { model: EstablishmentSetting, as: 'settings' }
        ]
      });
      
      if (!establishment) {
        return res.status(404).json({ message: 'Estabelecimento não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== establishment.id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      return res.status(200).json(establishment);
    } catch (error) {
      logger.error(`Erro ao buscar estabelecimento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar estabelecimento' });
    }
  }
  
  /**
   * Criar novo estabelecimento (apenas para super admin)
   */
  static async create(req, res) {
    try {
      const {
        name, document, phone, email, address, city, state, postal_code,
        latitude, longitude, opening_time, closing_time, working_days,
        settings
      } = req.body;
      
      // Criar estabelecimento
      const establishment = await Establishment.create({
        name,
        document,
        phone,
        email,
        address,
        city,
        state,
        postal_code,
        latitude,
        longitude,
        opening_time,
        closing_time,
        working_days,
        active: true
      });
      
      // Criar configurações para o estabelecimento
      if (settings) {
        await EstablishmentSetting.create({
          establishment_id: establishment.id,
          reminder_time: settings.reminder_time || 30,
          auto_confirm: settings.auto_confirm !== undefined ? settings.auto_confirm : true,
          welcome_message: settings.welcome_message,
          confirmation_message: settings.confirmation_message,
          reminder_message: settings.reminder_message,
          farewell_message: settings.farewell_message
        });
      } else {
        // Criar configurações padrão
        await EstablishmentSetting.create({
          establishment_id: establishment.id,
          reminder_time: 30,
          auto_confirm: true,
          welcome_message: `Olá! Bem-vindo(a) a ${establishment.name}. Como posso ajudar?`,
          confirmation_message: `Seu agendamento foi confirmado. Obrigado por escolher a ${establishment.name}!`,
          reminder_message: `Lembrete: Você tem um agendamento hoje na ${establishment.name}. Confirma sua presença?`,
          farewell_message: `Obrigado pela visita à ${establishment.name}. Esperamos vê-lo(a) novamente em breve!`
        });
      }
      
      // Buscar estabelecimento com configurações
      const establishmentWithSettings = await Establishment.findByPk(establishment.id, {
        include: [
          { model: EstablishmentSetting, as: 'settings' }
        ]
      });
      
      return res.status(201).json(establishmentWithSettings);
    } catch (error) {
      logger.error(`Erro ao criar estabelecimento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao criar estabelecimento' });
    }
  }
  
  /**
   * Atualizar estabelecimento
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name, document, phone, email, address, city, state, postal_code,
        latitude, longitude, opening_time, closing_time, working_days, active,
        settings
      } = req.body;
      
      const establishment = await Establishment.findByPk(id);
      
      if (!establishment) {
        return res.status(404).json({ message: 'Estabelecimento não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== establishment.id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Atualizar dados
      if (name) establishment.name = name;
      if (document) establishment.document = document;
      if (phone) establishment.phone = phone;
      if (email) establishment.email = email;
      if (address) establishment.address = address;
      if (city) establishment.city = city;
      if (state) establishment.state = state;
      if (postal_code) establishment.postal_code = postal_code;
      if (latitude) establishment.latitude = latitude;
      if (longitude) establishment.longitude = longitude;
      if (opening_time) establishment.opening_time = opening_time;
      if (closing_time) establishment.closing_time = closing_time;
      if (working_days) establishment.working_days = working_days;
      if (active !== undefined) establishment.active = active;
      
      await establishment.save();
      
      // Atualizar configurações se fornecidas
      if (settings) {
        let establishmentSettings = await EstablishmentSetting.findOne({
          where: { establishment_id: id }
        });
        
        if (!establishmentSettings) {
          // Criar configurações se não existirem
          establishmentSettings = await EstablishmentSetting.create({
            establishment_id: id,
            reminder_time: settings.reminder_time || 30,
            auto_confirm: settings.auto_confirm !== undefined ? settings.auto_confirm : true,
            welcome_message: settings.welcome_message,
            confirmation_message: settings.confirmation_message,
            reminder_message: settings.reminder_message,
            farewell_message: settings.farewell_message
          });
        } else {
          // Atualizar configurações existentes
          if (settings.reminder_time !== undefined) establishmentSettings.reminder_time = settings.reminder_time;
          if (settings.auto_confirm !== undefined) establishmentSettings.auto_confirm = settings.auto_confirm;
          if (settings.welcome_message) establishmentSettings.welcome_message = settings.welcome_message;
          if (settings.confirmation_message) establishmentSettings.confirmation_message = settings.confirmation_message;
          if (settings.reminder_message) establishmentSettings.reminder_message = settings.reminder_message;
          if (settings.farewell_message) establishmentSettings.farewell_message = settings.farewell_message;
          
          await establishmentSettings.save();
        }
      }
      
      // Buscar estabelecimento atualizado com configurações
      const updatedEstablishment = await Establishment.findByPk(id, {
        include: [
          { model: EstablishmentSetting, as: 'settings' }
        ]
      });
      
      return res.status(200).json(updatedEstablishment);
    } catch (error) {
      logger.error(`Erro ao atualizar estabelecimento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao atualizar estabelecimento' });
    }
  }
  
  /**
   * Desativar estabelecimento (soft delete)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const establishment = await Establishment.findByPk(id);
      
      if (!establishment) {
        return res.status(404).json({ message: 'Estabelecimento não encontrado' });
      }
      
      // Apenas super admin pode desativar estabelecimentos
      if (req.user.role_id !== 1) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Desativar estabelecimento (soft delete)
      establishment.active = false;
      await establishment.save();
      
      return res.status(200).json({ message: 'Estabelecimento desativado com sucesso' });
    } catch (error) {
      logger.error(`Erro ao desativar estabelecimento: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao desativar estabelecimento' });
    }
  }
  
  /**
   * Obter estatísticas do estabelecimento
   */
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      
      const establishment = await Establishment.findByPk(id);
      
      if (!establishment) {
        return res.status(404).json({ message: 'Estabelecimento não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== establishment.id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Contar profissionais
      const professionalsCount = await User.count({
        where: {
          establishment_id: id,
          role_id: 3, // role de profissional
          active: true
        }
      });
      
      // Contar categorias
      const categoriesCount = await ServiceCategory.count({
        where: {
          establishment_id: id,
          active: true
        }
      });
      
      // Contar serviços
      const servicesCount = await Service.count({
        where: {
          establishment_id: id,
          active: true
        }
      });
      
      // Retornar estatísticas
      return res.status(200).json({
        establishment: {
          id: establishment.id,
          name: establishment.name
        },
        stats: {
          professionals: professionalsCount,
          categories: categoriesCount,
          services: servicesCount
        }
      });
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar estatísticas do estabelecimento' });
    }
  }
}

module.exports = EstablishmentController;
