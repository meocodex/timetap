// src/consultas/consultas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ConsultasService {
  constructor(private prisma: PrismaService) {}

  async create(createConsultaDto: any, userId: number) {
    return this.prisma.consulta.create({
      data: {
        ...createConsultaDto,
        solicitanteId: userId,
        dataSolicitacao: new Date(),
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    userId?: number;
    perfil?: string;
  }) {
    const { page, limit, status, userId, perfil } = params;
    const skip = (page - 1) * limit;

    let where = {};
    
    // Filtro por status
    if (status) {
      where = { ...where, statusConsulta: status };
    }
    
    // Filtro por usuário (se for cliente)
    if (perfil === 'CLIENTE' && userId) {
      where = { ...where, solicitanteId: userId };
    }

    const [consultas, total] = await Promise.all([
      this.prisma.consulta.findMany({
        skip,
        take: limit,
        where,
        orderBy: { dataSolicitacao: 'desc' },
        include: {
          solicitante: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          analista: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          motorista: perfil !== 'CLIENTE' ? true : undefined,
          veiculo: perfil !== 'CLIENTE' ? true : undefined,
          proprietario: perfil !== 'CLIENTE' ? true : undefined,
          empresa: perfil !== 'CLIENTE' ? true : undefined,
        },
      }),
      this.prisma.consulta.count({ where }),
    ]);

    return {
      data: consultas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        analista: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        motorista: true,
        veiculo: true,
        proprietario: true,
        empresa: true,
        anexos: true,
      },
    });

    if (!consulta) {
      throw new NotFoundException(`Consulta com ID ${id} não encontrada`);
    }

    return consulta;
  }

  async updateStatus(
    id: number,
    status: string,
    observacoes: string,
    analistaId: number,
  ) {
    const consulta = await this.findOne(id);
    
    const updateData: any = {
      statusConsulta: status,
      observacoes,
      analistaId,
    };
    
    // Atualizar datas conforme o status
    if (status === 'EM_ANALISE') {
      updateData.dataAnalise = new Date();
    }
    
    if (status === 'APROVADO' || status === 'REJEITADO') {
      updateData.dataConclusao = new Date();
      
      // Também atualizar o status da entidade relacionada
      const entidadeStatus = status === 'APROVADO' ? 'APROVADO' : 'REJEITADO';
      
      if (consulta.motoristaId) {
        await this.prisma.motorista.update({
          where: { id: consulta.motoristaId },
          data: { statusAprovacao: entidadeStatus },
        });
      } else if (consulta.veiculoId) {
        await this.prisma.veiculo.update({
          where: { id: consulta.veiculoId },
          data: { statusAprovacao: entidadeStatus },
        });
      } else if (consulta.proprietarioId) {
        await this.prisma.proprietario.update({
          where: { id: consulta.proprietarioId },
          data: { statusAprovacao: entidadeStatus },
        });
      } else if (consulta.empresaId) {
        await this.prisma.empresa.update({
          where: { id: consulta.empresaId },
          data: { statusAprovacao: entidadeStatus },
        });
      }
    }

    return this.prisma.consulta.update({
      where: { id },
      data: updateData,
    });
  }
  
  async getRecent() {
    return this.prisma.consulta.findMany({
      take: 10,
      orderBy: { dataSolicitacao: 'desc' },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  }
}