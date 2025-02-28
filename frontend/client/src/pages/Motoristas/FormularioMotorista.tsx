// src/pages/Motoristas/FormularioMotorista.tsx
import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Textarea,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { FiUser, FiMap, FiFileText, FiSave, FiCheck } from 'react-icons/fi';

// Schema de validação com Zod
const motoristaSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido' }),
  rg: z.string().min(5, { message: 'RG inválido' }),
  dataNascimento: z.string(),
  email: z.string().email({ message: 'Email inválido' }),
  telefone: z.string().min(10, { message: 'Telefone inválido' }),
  status: z.enum(['ativo', 'inativo', 'pendente']),
  
  endereco: z.object({
    rua: z.string().min(3, { message: 'Rua é obrigatória' }),
    numero: z.string(),
    complemento: z.string().optional(),
    bairro: z.string().min(2, { message: 'Bairro é obrigatório' }),
    cidade: z.string().min(2, { message: 'Cidade é obrigatória' }),
    estado: z.string().length(2, { message: 'Estado inválido' }),
    cep: z.string().regex(/^\d{5}-\d{3}$/, { message: 'CEP inválido (formato: 12345-678)' }),
  }),
  
  cnh: z.object({
    numero: z.string().min(3, { message: 'Número da CNH inválido' }),
    categoria: z.enum(['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE']),
    validade: z.string(),
    dataEmissao: z.string(),
  }),
  
  observacoes: z.string().optional(),
});

// Tipo inferido do schema
type MotoristaFormData = z.infer<typeof motoristaSchema>;

// Dados de exemplo para quando a API não estiver disponível em modo de edição
const mockMotorista: MotoristaFormData = {
  nome: 'João Silva',
  cpf: '123.456.789-00',
  rg: '12.345.678-9',
  dataNascimento: '1985-05-15',
  email: 'joao.silva@email.com',
  telefone: '(11) 99999-9999',
  status: 'ativo',
  endereco: {
    rua: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
  },
  cnh: {
    numero: '12345678900',
    categoria: 'E',
    validade: '2025-12-31',
    dataEmissao: '2015-01-10',
  },
  observacoes: 'Motorista experiente com mais de 10 anos atuando em transporte de cargas pesadas.',
};

const FormularioMotorista: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Configuração do formulário com react-hook-form e zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
  });

  // Query para buscar dados do motorista em modo de edição
  const { data: motorista, isLoading, isError } = useQuery(
    ['motorista', id],
    async () => {
      if (!isEditMode) return null;
      
      try {
        const response = await api.get(`/motoristas/${id}`);
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar dados do motorista:', error);
        throw error;
      }
    },
    {
      enabled: isEditMode,
      staleTime: 1000 * 60 * 5, // 5 minutos
    }
  );

  // Mutation para criar novo motorista
  const createMutation = useMutation(
    async (data: MotoristaFormData) => {
      try {
        return await api.post('/motoristas', data);
      } catch (error) {
        console.error('Erro ao criar motorista:', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast({
          title: 'Motorista cadastrado',
          description: 'O motorista foi cadastrado com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        queryClient.invalidateQueries('motoristas');
        navigate('/motoristas');
      },
      onError: () => {
        toast({
          title: 'Erro ao cadastrar',
          description: 'Ocorreu um erro ao cadastrar o motorista.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  // Mutation para atualizar motorista existente
  const updateMutation = useMutation(
    async (data: MotoristaFormData) => {
      try {
        return await api.put(`/motoristas/${id}`, data);
      } catch (error) {
        console.error('Erro ao atualizar motorista:', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast({
          title: 'Motorista atualizado',
          description: 'Os dados do motorista foram atualizados com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        queryClient.invalidateQueries(['motorista', id]);
        queryClient.invalidateQueries('motoristas');
        navigate(`/motoristas/${id}`);
      },
      onError: () => {
        toast({
          title: 'Erro ao atualizar',
          description: 'Ocorreu um erro ao atualizar os dados do motorista.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  // Atualiza o formulário quando os dados do motorista são carregados
  useEffect(() => {
    if (motorista) {
      reset(motorista);
    }
  }, [motorista, reset]);

  // Pré-carrega os dados de exemplo quando não está chamando API
  useEffect(() => {
    if (isEditMode && !isLoading && !motorista) {
      reset(mockMotorista);
    }
  }, [isEditMode, isLoading, motorista, reset, mockMotorista]);

  // Função para submissão do formulário
  const onSubmit = (data: MotoristaFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="500px">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (isError && isEditMode) {
    return (
      <Box>
        <PageHeader 
          title="Erro ao carregar dados" 
          showBackButton={true} 
        />
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          p="10"
        >
          <Heading size="md" mb="4">Não foi possível carregar os dados do motorista.</Heading>
          <Button 
            colorScheme="brand" 
            onClick={() => navigate('/motoristas')}
          >
            Voltar para Lista
          </Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isEditMode ? `Editar Motorista: ${motorista?.nome || ''}` : 'Novo Motorista'}
        showBackButton
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs
          colorScheme="brand"
          variant="enclosed"
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          borderRadius="lg"
          boxShadow="sm"
          overflow="hidden"
        >
          <TabList>
            <Tab><Icon as={FiUser} mr="2" /> Dados Pessoais</Tab>
            <Tab><Icon as={FiMap} mr="2" /> Endereço</Tab>
            <Tab><Icon as={FiFileText} mr="2" /> Documentos</Tab>
          </TabList>

          <TabPanels>
            {/* Dados Pessoais */}
            <TabPanel>
              <Card>
                <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
                  <Heading size="md">Informações Pessoais</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing="6">
                    <FormControl isInvalid={!!errors.nome}>
                      <FormLabel htmlFor="nome">Nome Completo</FormLabel>
                      <Input
                        id="nome"
                        placeholder="Nome do motorista"
                        {...register('nome')}
                      />
                      {errors.nome && (
                        <FormErrorMessage>{errors.nome.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.cpf}>
                      <FormLabel htmlFor="cpf">CPF</FormLabel>
                      <Input
                        id="cpf"
                        placeholder="123.456.789-00"
                        {...register('cpf')}
                      />
                      {errors.cpf && (
                        <FormErrorMessage>{errors.cpf.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.rg}>
                      <FormLabel htmlFor="rg">RG</FormLabel>
                      <Input
                        id="rg"
                        placeholder="12.345.678-9"
                        {...register('rg')}
                      />
                      {errors.rg && (
                        <FormErrorMessage>{errors.rg.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.dataNascimento}>
                      <FormLabel htmlFor="dataNascimento">Data de Nascimento</FormLabel>
                      <Input
                        id="dataNascimento"
                        type="date"
                        {...register('dataNascimento')}
                      />
                      {errors.dataNascimento && (
                        <FormErrorMessage>{errors.dataNascimento.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.email}>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="nome@email.com"
                        {...register('email')}
                      />
                      {errors.email && (
                        <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.telefone}>
                      <FormLabel htmlFor="telefone">Telefone</FormLabel>
                      <Input
                        id="telefone"
                        placeholder="(11) 99999-9999"
                        {...register('telefone')}
                      />
                      {errors.telefone && (
                        <FormErrorMessage>{errors.telefone.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.status}>
                      <FormLabel htmlFor="status">Status</FormLabel>
                      <Select id="status" {...register('status')}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="pendente">Pendente</option>
                      </Select>
                      {errors.status && (
                        <FormErrorMessage>{errors.status.message}</FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Endereço */}
            <TabPanel>
              <Card>
                <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
                  <Heading size="md">Endereço</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(6, 1fr)' }} gap="6">
                    <GridItem colSpan={{ base: 1, md: 4 }}>
                      <FormControl isInvalid={!!errors.endereco?.rua}>
                        <FormLabel htmlFor="endereco.rua">Rua</FormLabel>
                        <Input
                          id="endereco.rua"
                          placeholder="Nome da rua"
                          {...register('endereco.rua')}
                        />
                        {errors.endereco?.rua && (
                          <FormErrorMessage>{errors.endereco.rua.message}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl isInvalid={!!errors.endereco?.numero}>
                        <FormLabel htmlFor="endereco.numero">Número</FormLabel>
                        <Input
                          id="endereco.numero"
                          placeholder="123"
                          {...register('endereco.numero')}
                        />
                        {errors.endereco?.numero && (
                          <FormErrorMessage>{errors.endereco.numero.message}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 3 }}>
                      <FormControl isInvalid={!!errors.endereco?.complemento}>
                        <FormLabel htmlFor="endereco.complemento">Complemento</FormLabel>
                        <Input
                          id="endereco.complemento"
                          placeholder="Apto, Bloco, etc."
                          {...register('endereco.complemento')}
                        />
                        {errors.endereco?.complemento && (
                          <FormErrorMessage>{errors.endereco.complemento.message}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 3 }}>
                      <FormControl isInvalid={!!errors.endereco?.bairro}>
                        <FormLabel htmlFor="endereco.bairro">Bairro</FormLabel>
                        <Input
                          id="endereco.bairro"
                          placeholder="Nome do bairro"
                          {...register('endereco.bairro')}
                        />
                        {errors.endereco?.bairro && (
                          <FormErrorMessage>{errors.endereco.bairro.message}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 3 }}>
                      <FormControl isInvalid={!!errors.endereco?.cidade}>
                        <FormLabel htmlFor="endereco.cidade">Cidade</FormLabel>
                        <Input
                          id="endereco.cidade"
                          placeholder="Nome da cidade"
                          {...register('endereco.cidade')}
                        />
                        {errors.endereco?.cidade && (
                          <FormErrorMessage>{errors.endereco.cidade.message}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl isInvalid={!!errors.endereco?.estado}>
                        <FormLabel htmlFor="endereco.estado">Estado</FormLabel>
                        <Select id="endereco.estado" {...register('endereco.estado')}>
                          <option value="">Selecione</option>
                          <option value="AC">AC</option>
                          <option value="AL">AL</option>
                          <option value="AP">AP</option>
                          <option value="AM">AM</option>
                          <option value="BA">BA</option>
                          <option value="CE">CE</option>
                          <option value="DF">DF</option>
                          <option value="ES">ES</option>
                          <option value="GO">GO</option>
                          <option value="MA">MA</option>
                          <option value="MT">MT</option>
                          <option value="MS">MS</option>
                          <option value="MG">MG</option>
                          <option value="PA">PA</option>
                          <option value="PB">PB</option>
                          <option value="PR">PR</option>
                          <option value="PE">PE</option>
                          <option value="PI">PI</option>
                          <option value="RJ">RJ</option>
                          <option value="RN">RN</option>
                          <option value="RS">RS</option>
                          <option value="RO">RO</option>
                          <option value="RR">RR</option>
                          <option value="SC">SC</option>
                          <option value="SP">SP</option>
                          <option value="SE">SE</option>
                          <option value="TO">TO</option>
                        </Select>
                        {errors.endereco?.estado && (
                          <FormErrorMessage>{errors.endereco.estado.message}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl isInvalid={!!errors.endereco?.cep}>
                        <FormLabel htmlFor="endereco.cep">CEP</FormLabel>
                        <Input
                          id="endereco.cep"
                          placeholder="12345-678"
                          {...register('endereco.cep')}
                        />
                        {errors.endereco?.cep && (
                          <FormErrorMessage>{errors.endereco.cep.message}</FormErrorMessage>
                        )}
                      </FormControl>
                    </GridItem>
                  </Grid>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Documentos e Informações Adicionais */}
            <TabPanel>
              <Card>
                <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
                  <Heading size="md">Carteira de Habilitação</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing="6">
                    <FormControl isInvalid={!!errors.cnh?.numero}>
                      <FormLabel htmlFor="cnh.numero">Número da CNH</FormLabel>
                      <Input
                        id="cnh.numero"
                        placeholder="12345678900"
                        {...register('cnh.numero')}
                      />
                      {errors.cnh?.numero && (
                        <FormErrorMessage>{errors.cnh.numero.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.cnh?.categoria}>
                      <FormLabel htmlFor="cnh.categoria">Categoria</FormLabel>
                      <Select id="cnh.categoria" {...register('cnh.categoria')}>
                        <option value="">Selecione</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="AB">AB</option>
                        <option value="AC">AC</option>
                        <option value="AD">AD</option>
                        <option value="AE">AE</option>
                      </Select>
                      {errors.cnh?.categoria && (
                        <FormErrorMessage>{errors.cnh.categoria.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.cnh?.dataEmissao}>
                      <FormLabel htmlFor="cnh.dataEmissao">Data de Emissão</FormLabel>
                      <Input
                        id="cnh.dataEmissao"
                        type="date"
                        {...register('cnh.dataEmissao')}
                      />
                      {errors.cnh?.dataEmissao && (
                        <FormErrorMessage>{errors.cnh.dataEmissao.message}</FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!errors.cnh?.validade}>
                      <FormLabel htmlFor="cnh.validade">Validade</FormLabel>
                      <Input
                        id="cnh.validade"
                        type="date"
                        {...register('cnh.validade')}
                      />
                      {errors.cnh?.validade && (
                        <FormErrorMessage>{errors.cnh.validade.message}</FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              <Card mt="6">
                <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
                  <Heading size="md">Observações</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <FormControl isInvalid={!!errors.observacoes}>
                    <FormLabel htmlFor="observacoes">Informações Adicionais</FormLabel>
                    <Textarea
                      id="observacoes"
                      placeholder="Informações adicionais sobre o motorista"
                      rows={4}
                      {...register('observacoes')}
                    />
                    {errors.observacoes && (
                      <FormErrorMessage>{errors.observacoes.message}</FormErrorMessage>
                    )}
                  </FormControl>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Flex mt="6" justify="flex-end" gap="4">
          <Button
            variant="outline"
            onClick={() => navigate('/motoristas')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            colorScheme="brand"
            leftIcon={<Icon as={isEditMode ? FiCheck : FiSave} />}
            isLoading={isSubmitting}
            loadingText={isEditMode ? 'Salvando...' : 'Criando...'}
          >
            {isEditMode ? 'Salvar Alterações' : 'Cadastrar Motorista'}
          </Button>
        </Flex>
      </form>
    </Box>
  );
};

export default FormularioMotorista;