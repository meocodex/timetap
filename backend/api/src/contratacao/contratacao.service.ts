// src/contratacao/contratacao.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ContratacaoService {
  constructor(private prisma: PrismaService) {}

  async create(createContratacaoDto: any) {
    return this.prisma.contratacao.create({
      data: createContratacaoDto,
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    empresaId?: number;
    motoristaId?: number;
  }) {
    const { page, limit, empresaId, motoristaId } = params;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (empresaId) {
      where = { ...where, empresaId };
    }
    
    if (motoristaId) {
      where = { ...where, motoristaId };
    }

    const [contratacoes, total] = await Promise.all([
      this.prisma.contratacao.findMany({
        skip,
        take: limit,
        where,
        include: {
          empresa: true,
          motorista: true,
          veiculo: true,
        },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.contratacao.count({ where }),
    ]);

    return {
      data: contratacoes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const contratacao = await this.prisma.contratacao.findUnique({
      where: { id },
      include: {
        empresa: true,
        motorista: true,
        veiculo: true,
      },
    });

    if (!contratacao) {
      throw new NotFoundException(`Contratação com ID ${id} não encontrada`);
    }

    return contratacao;
  }

  async update(id: number, updateContratacaoDto: any) {
    await this.findOne(id);

    return this.prisma.contratacao.update({
      where: { id },
      data: {
        ...updateContratacaoDto,
        atualizadoEm: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.contratacao.delete({
      where: { id },
    });
  }
}