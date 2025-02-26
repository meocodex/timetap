// src/controllers/service.controller.js
const { Service, ServiceCategory, User, ProfessionalService } = require('../models');
const logger = require('../config/logger');

class ServiceController {
  /**
   * Listar serviços por estabelecimento
   */
  static async findByEstablishment(req, res) {
    try {
      const { establishmentId } = req.params;
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== parseInt(establishmentId)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const services = await Service.findAll({
        where: {
          establishment_id: establishmentId,
          active: true
        },
        include: [
          { model: ServiceCategory, as: 'category' }
        ]
      });
      
      return res.status(200).json(services);
    } catch (error) {
      logger.error(`Erro ao listar serviços: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar serviços' });
    }
  }
  
  /**
   * Buscar serviço por ID
   */
  static async findById(req, res) {
    try {
      const { id } = req.params;
      
      const service = await Service.findByPk(id, {
        include: [
          { model: ServiceCategory, as: 'category' },
          {
            model: User,
            as: 'professionals',
            attributes: ['id', 'name', 'phone'],
            through: {
              attributes: ['custom_commission_percentage']
            }
          }
        ]
      });
      
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== service.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      return res.status(200).json(service);
    } catch (error) {
      logger.error(`Erro ao buscar serviço: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar serviço' });
    }
  }
  
  /**
   * Criar novo serviço
   */
  static async create(req, res) {
    try {
      const {
        establishment_id, category_id, name, description, duration,
        price, has_commission, commission_percentage, professionals
      } = req.body;
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Criar serviço
      const service = await Service.create({
        establishment_id,
        category_id,
        name,
        description,
        duration,
        price,
        has_commission,
        commission_percentage: has_commission ? commission_percentage : null,
        active: true
      });
      
      // Associar profissionais se fornecidos
      if (professionals && Array.isArray(professionals) && professionals.length > 0) {
        const professionalServices = professionals.map(professional => ({
          professional_id: professional.id,
          service_id: service.id,
          custom_commission_percentage: professional.custom_commission_percentage
        }));
        
        await ProfessionalService.bulkCreate(professionalServices);
      }
      
      // Buscar serviço com relações
      const createdService = await Service.findByPk(service.id, {
        include: [
          { model: ServiceCategory, as: 'category' },
          {
            model: User,
            as: 'professionals',
            attributes: ['id', 'name', 'phone'],
            through: {
              attributes: ['custom_commission_percentage']
            }
          }
        ]
      });
      
      return res.status(201).json(createdService);
    } catch (error) {
      logger.error(`Erro ao criar serviço: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao criar serviço' });
    }
  }
  
  /**
   * Atualizar serviço
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        category_id, name, description, duration,
        price, has_commission, commission_percentage, active,
        professionals
      } = req.body;
      
      const service = await Service.findByPk(id);
      
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== service.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Atualizar dados
      if (category_id !== undefined) service.category_id = category_id;
      if (name) service.name = name;
      if (description !== undefined) service.description = description;
      if (duration !== undefined) service.duration = duration;
      if (price !== undefined) service.price = price;
      if (has_commission !== undefined) {
        service.has_commission = has_commission;
        if (!has_commission) {
          service.commission_percentage = null;
        }
      }
      if (has_commission && commission_percentage !== undefined) {
        service.commission_percentage = commission_percentage;
      }
      if (active !== undefined) service.active = active;
      
      await service.save();
      
      // Atualizar relações com profissionais se fornecidos
      if (professionals && Array.isArray(professionals)) {
        // Remover associações existentes
        await ProfessionalService.destroy({
          where: { service_id: id }
        });
        
        // Criar novas associações
        if (professionals.length > 0) {
          const professionalServices = professionals.map(professional => ({
            professional_id: professional.id,
            service_id: id,
            custom_commission_percentage: professional.custom_commission_percentage
          }));
          
          await ProfessionalService.bulkCreate(professionalServices);
        }
      }
      
      // Buscar serviço atualizado com relações
      const updatedService = await Service.findByPk(id, {
        include: [
          { model: ServiceCategory, as: 'category' },
          {
            model: User,
            as: 'professionals',
            attributes: ['id', 'name', 'phone'],
            through: {
              attributes: ['custom_commission_percentage']
            }
          }
        ]
      });
      
      return res.status(200).json(updatedService);
    } catch (error) {
      logger.error(`Erro ao atualizar serviço: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao atualizar serviço' });
    }
  }
  
  /**
   * Deletar serviço (soft delete)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const service = await Service.findByPk(id);
      
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== service.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Desativar serviço (soft delete)
      service.active = false;
      await service.save();
      
      return res.status(200).json({ message: 'Serviço desativado com sucesso' });
    } catch (error) {
      logger.error(`Erro ao deletar serviço: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao deletar serviço' });
    }
  }
  
  /**
   * Listar serviços por profissional
   */
  static async findByProfessional(req, res) {
    try {
      const { professionalId } = req.params;
      
      const professional = await User.findByPk(professionalId);
      
      if (!professional) {
        return res.status(404).json({ message: 'Profissional não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== professional.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const services = await Service.findAll({
        include: [
          {
            model: User,
            as: 'professionals',
            where: { id: professionalId },
            through: {
              attributes: ['custom_commission_percentage']
            }
          },
          { model: ServiceCategory, as: 'category' }
        ]
      });
      
      return res.status(200).json(services);
    } catch (error) {
      logger.error(`Erro ao listar serviços por profissional: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao buscar serviços do profissional' });
    }
  }
  
  /**
   * Adicionar profissional a um serviço
   */
  static async addProfessional(req, res) {
    try {
      const { serviceId, professionalId } = req.params;
      const { custom_commission_percentage } = req.body;
      
      const service = await Service.findByPk(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      const professional = await User.findByPk(professionalId);
      
      if (!professional || professional.role_id !== 3) { // 3 = professional
        return res.status(404).json({ message: 'Profissional não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== service.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Verificar se já existe a associação
      const existing = await ProfessionalService.findOne({
        where: {
          service_id: serviceId,
          professional_id: professionalId
        }
      });
      
      if (existing) {
        return res.status(400).json({ message: 'Profissional já está associado a este serviço' });
      }
      
      // Criar associação
      await ProfessionalService.create({
        service_id: serviceId,
        professional_id: professionalId,
        custom_commission_percentage
      });
      
      return res.status(201).json({ message: 'Profissional adicionado ao serviço com sucesso' });
    } catch (error) {
      logger.error(`Erro ao adicionar profissional ao serviço: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao adicionar profissional ao serviço' });
    }
  }
  
  /**
   * Remover profissional de um serviço
   */
  static async removeProfessional(req, res) {
    try {
      const { serviceId, professionalId } = req.params;
      
      const service = await Service.findByPk(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: 'Serviço não encontrado' });
      }
      
      // Verificar permissões
      if (req.user.role_id !== 1 && req.user.establishment_id !== service.establishment_id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Verificar se existe a associação
      const association = await ProfessionalService.findOne({
        where: {
          service_id: serviceId,
          professional_id: professionalId
        }
      });
      
      if (!association) {
        return res.status(404).json({ message: 'Profissional não está associado a este serviço' });
      }
      
      // Remover associação
      await association.destroy();
      
      return res.status(200).json({ message: 'Profissional removido do serviço com sucesso' });
    } catch (error) {
      logger.error(`Erro ao remover profissional do serviço: ${error.message}`);
      return res.status(500).json({ message: 'Erro ao remover profissional do serviço' });
    }
  }
}

module.exports = ServiceController;
