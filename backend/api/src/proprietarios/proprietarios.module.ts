// src/proprietarios/proprietarios.module.ts
import { Module } from '@nestjs/common';
import { ProprietariosService } from './proprietarios.service';
import { ProprietariosController } from './proprietarios.controller';

@Module({
  controllers: [ProprietariosController],
  providers: [ProprietariosService],
  exports: [ProprietariosService],
})
export class ProprietariosModule {}