// src/veiculos/veiculos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma, StatusAprovacao } from '@prisma/client'; // Importa o enum StatusAprovacao

@Injectable()
export class VeiculosService {
  constructor(private prisma: PrismaService) {}

  async create(createVeiculoDto: any, userId: number) {
    return this.prisma.veiculo.create({
      data: {
        ...createVeiculoDto,
        criadoPorId: userId,
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search: string;
    proprietarioId?: number;
  }) {
    const { page, limit, search, proprietarioId } = params;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (search) {
      where = {
        OR: [
          { placa: { contains: search, mode: 'insensitive' } },
          { renavam: { contains: search, mode: 'insensitive' } },
          { chassi: { contains: search, mode: 'insensitive' } },
          { marca: { contains: search, mode: 'insensitive' } },
          { modelo: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    
    if (proprietarioId) {
      where = { ...where, proprietarioId };
    }

    const [veiculos, total] = await Promise.all([
      this.prisma.veiculo.findMany({
        skip,
        take: limit,
        where,
        include: {
          proprietario: true,
        },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.veiculo.count({ where }),
    ]);

    return {
      data: veiculos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id },
      include: {
        proprietario: true,
        anexos: true,
        consultas: {
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
          },
        },
        contratacoes: {
          include: {
            empresa: true,
            motorista: true,
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    return veiculo;
  }

  async update(id: number, updateVeiculoDto: any) {
    await this.findOne(id);

    return this.prisma.veiculo.update({
      where: { id },
      data: {
        ...updateVeiculoDto,
        atualizadoEm: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.veiculo.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, statusAprovacao: string, observacoes: string) {
    await this.findOne(id);

    // Converte a string para o valor do enum importado.
    const status = statusAprovacao as StatusAprovacao;
    
    const veiculo = await this.prisma.veiculo.update({
      where: { id },
      data: {
        statusAprovacao: status,
        observacoes,
        atualizadoEm: new Date(),
      },
    });

    return veiculo;
  }
}
