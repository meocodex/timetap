// src/motoristas/dto/update-motorista.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateMotoristaDto } from './create-motorista.dto';

export class UpdateMotoristaDto extends PartialType(CreateMotoristaDto) {}