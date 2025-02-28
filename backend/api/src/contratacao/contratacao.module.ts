// src/contratacao/contratacao.module.ts
import { Module } from '@nestjs/common';
import { ContratacaoService } from './contratacao.service';
import { ContratacaoController } from './contratacao.controller';

@Module({
  controllers: [ContratacaoController],
  providers: [ContratacaoService],
  exports: [ContratacaoService],
})
export class ContratacaoModule {}