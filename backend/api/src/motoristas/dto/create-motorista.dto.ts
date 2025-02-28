// src/motoristas/dto/create-motorista.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMotoristaDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo do motorista' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  nome: string;

  @ApiProperty({ example: '123.456.789-00', description: 'CPF do motorista' })
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @IsString()
  cpf: string;

  @ApiProperty({ example: '1990-01-01', description: 'Data de nascimento do motorista' })
  @IsNotEmpty({ message: 'Data de nascimento é obrigatória' })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty({ example: '12345678900', description: 'Número da CNH do motorista' })
  @IsOptional()
  @IsString()
  cnh?: string;

  @ApiProperty({ example: 'AB', description: 'Categoria da CNH do motorista' })
  @IsOptional()
  @IsString()
  cnhCategoria?: string;

  @ApiProperty({ example: '2025-01-01', description: 'Data de validade da CNH' })
  @IsOptional()
  @IsDateString()
  cnhValidade?: string;

  @ApiProperty({ example: '123456789', description: 'Número do RG do motorista' })
  @IsOptional()
  @IsString()
  rg?: string;

  @ApiProperty({ example: 'SSP-SP', description: 'Órgão emissor do RG' })
  @IsOptional()
  @IsString()
  orgaoEmissor?: string;

  @ApiProperty({ example: 'Rua Exemplo, 123', description: 'Endereço do motorista' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade do motorista' })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiProperty({ example: 'SP', description: 'Estado do motorista' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiProperty({ example: '01234-567', description: 'CEP do motorista' })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone do motorista' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ example: 'motorista@email.com', description: 'Email do motorista' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Observações adicionais', description: 'Observações sobre o motorista' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}