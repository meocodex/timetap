// src/motoristas/motoristas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateMotoristaDto } from './dto/create-motorista.dto';
import { UpdateMotoristaDto } from './dto/update-motorista.dto';
import { Prisma, StatusAprovacao } from '@prisma/client'; // Importa o enum StatusAprovacao

@Injectable()
export class MotoristasService {
  constructor(private prisma: PrismaService) {}

  async create(createMotoristaDto: CreateMotoristaDto, userId: number) {
    return this.prisma.motorista.create({
      data: {
        ...createMotoristaDto,
        criadoPorId: userId,
      },
    });
  }

  async findAll(params: { page: number; limit: number; search: string; }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { cpf: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [motoristas, total] = await Promise.all([
      this.prisma.motorista.findMany({
        skip,
        take: limit,
        where,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.motorista.count({ where }),
    ]);

    return {
      data: motoristas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const motorista = await this.prisma.motorista.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!motorista) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    return motorista;
  }

  async update(id: number, updateMotoristaDto: UpdateMotoristaDto, userId: number) {
    await this.findOne(id);

    return this.prisma.motorista.update({
      where: { id },
      data: {
        ...updateMotoristaDto,
        atualizadoEm: new Date(),
        // Se houver campo para registrar o usuário que atualizou, descomente a linha abaixo:
        // atualizadoPorId: userId,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.motorista.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, statusAprovacao: string, observacoes: string, userId: number) {
    await this.findOne(id);

    // Converte a string para o valor do enum importado
    // Recomenda-se validar se o valor é realmente válido.
    const status = statusAprovacao as StatusAprovacao;

    const motorista = await this.prisma.motorista.update({
      where: { id },
      data: {
        statusAprovacao: status,
        observacoes,
        atualizadoEm: new Date(),
        // Registra o usuário que atualizou, se o seu schema possuir esse campo
        atualizadoPorId: userId,
      },
    });

    return motorista;
  }
}
