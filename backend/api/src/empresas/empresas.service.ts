// src/empresas/empresas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { StatusAprovacao, Prisma } from '@prisma/client'; // Importa o enum StatusAprovacao

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async create(createEmpresaDto: any, userId: number) {
    return this.prisma.empresa.create({
      data: {
        ...createEmpresaDto,
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
            { razaoSocial: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { nomeFantasia: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { cnpj: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [empresas, total] = await Promise.all([
      this.prisma.empresa.findMany({
        skip,
        take: limit,
        where,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.empresa.count({ where }),
    ]);

    return {
      data: empresas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
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
        contratacoes: {
          include: {
            motorista: true,
            veiculo: true,
          },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    return empresa;
  }

  async update(id: number, updateEmpresaDto: any) {
    await this.findOne(id);

    return this.prisma.empresa.update({
      where: { id },
      data: {
        ...updateEmpresaDto,
        atualizadoEm: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.empresa.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, statusAprovacao: string, observacoes: string) {
    await this.findOne(id);

    // Converte a string para o valor do enum importado
    // Recomenda-se adicionar uma validação para garantir que o valor seja válido.
    const status = statusAprovacao as StatusAprovacao;

    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: {
        statusAprovacao: status,
        observacoes,
        atualizadoEm: new Date(),
      },
    });

    // Atualiza as consultas relacionadas com status "AGUARDANDO" ou "EM_ANALISE"
    await this.prisma.consulta.updateMany({
      where: {
        empresaId: id,
        statusConsulta: { in: ['AGUARDANDO', 'EM_ANALISE'] },
      },
      data: {
        statusConsulta: status === 'APROVADO' ? 'APROVADO' : 'REJEITADO',
        observacoes,
        dataConclusao: new Date(),
      },
    });

    return empresa;
  }
}
