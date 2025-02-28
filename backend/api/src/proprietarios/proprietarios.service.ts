// src/proprietarios/proprietarios.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { StatusAprovacao } from '@prisma/client'; // Importa o enum StatusAprovacao diretamente

@Injectable()
export class ProprietariosService {
  constructor(private prisma: PrismaService) {}

  async create(createProprietarioDto: any, userId: number) {
    return this.prisma.proprietario.create({
      data: {
        ...createProprietarioDto,
        criadoPorId: userId,
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search: string;
    tipoPessoa?: string;
  }) {
    const { page, limit, search, tipoPessoa } = params;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (search) {
      where = {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { documento: { contains: search, mode: 'insensitive' } },
          { razaoSocial: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    
    if (tipoPessoa) {
      where = { ...where, tipoPessoa };
    }

    const [proprietarios, total] = await Promise.all([
      this.prisma.proprietario.findMany({
        skip,
        take: limit,
        where,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.proprietario.count({ where }),
    ]);

    return {
      data: proprietarios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const proprietario = await this.prisma.proprietario.findUnique({
      where: { id },
      include: {
        anexos: true,
        veiculos: true,
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

    if (!proprietario) {
      throw new NotFoundException(`Proprietário com ID ${id} não encontrado`);
    }

    return proprietario;
  }

  async update(id: number, updateProprietarioDto: any) {
    await this.findOne(id);

    return this.prisma.proprietario.update({
      where: { id },
      data: {
        ...updateProprietarioDto,
        atualizadoEm: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.proprietario.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, statusAprovacao: string, observacoes: string) {
    await this.findOne(id);

    // Converte a string para o valor do enum importado.
    // É recomendável validar se o valor é realmente permitido.
    const status = statusAprovacao as StatusAprovacao;

    const proprietario = await this.prisma.proprietario.update({
      where: { id },
      data: {
        statusAprovacao: status,
        observacoes,
        atualizadoEm: new Date(),
      },
    });

    // Caso seja necessário atualizar outras entidades relacionadas, adicione a lógica aqui.

    return proprietario;
  }
}

