// src/pages/Motoristas/DetalhesMotorista.tsx
import React from 'react';
import {
  Box,
  Grid,
  GridItem,
  Text,
  Heading,
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackDivider,
  HStack,
  Icon,
  useColorMode,
  Flex,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { FiEdit, FiPrinter, FiFileText, FiUser, FiCalendar, FiTruck } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para motorista
interface Motorista {
  id: number;
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  status: 'ativo' | 'inativo' | 'pendente';
  cnh: {
    numero: string;
    categoria: string;
    validade: string;
    dataEmissao: string;
  };
  observacoes?: string;
  dataCadastro: string;
  dataAtualizacao: string;
}

const DetalhesMotorista: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // Fetch dos dados do motorista
  const { data: motorista, isLoading, isError } = useQuery<Motorista>(
    ['motorista', id],
    async () => {
      try {
        const response = await api.get(`/motoristas/${id}`);
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar detalhes do motorista:', error);
        throw error;
      }
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
    }
  );

  // Função para imprimir ficha do motorista
  const handlePrint = () => {
    toast({
      title: 'Gerando documento',
      description: 'A ficha do motorista está sendo preparada para impressão.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    // Lógica para impressão seria implementada aqui
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Status do motorista com cor
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'green';
      case 'inativo':
        return 'red';
      case 'pendente':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  // Dados de exemplo para quando a API não estiver disponível
  const mockMotorista: Motorista = {
    id: 1,
    nome: 'João Silva',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    dataNascimento: '1985-05-15',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-9999',
    endereco: {
      rua: 'Rua das Flores',
      numero: '123',
      complemento: 'Apto 45',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
    },
    status: 'ativo',
    cnh: {
      numero: '12345678900',
      categoria: 'E',
      validade: '2025-12-31',
      dataEmissao: '2015-01-10',
    },
    observacoes: 'Motorista experiente com mais de 10 anos atuando em transporte de cargas pesadas.',
    dataCadastro: '2022-01-01',
    dataAtualizacao: '2023-03-15',
  };

  // Usar dados de fallback quando API não estiver disponível
  const displayData = motorista || mockMotorista;

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="500px">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (isError) {
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
          <Text mb="4">Não foi possível carregar os detalhes do motorista.</Text>
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
        title={`Motorista: ${displayData.nome}`}
        showBackButton={true}
        actionButton={{
          label: "Editar",
          icon: <Icon as={FiEdit} />,
          onClick: () => navigate(`/motoristas/${id}/editar`),
        }}
      />

      <Grid templateColumns={{ base: 'repeat(1, 1fr)', lg: 'repeat(3, 1fr)' }} gap="6">
        {/* Informações Pessoais */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <Card>
            <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
              <Heading size="md">
                <HStack>
                  <Icon as={FiUser} />
                  <Text>Informações Pessoais</Text>
                </HStack>
              </Heading>
            </CardHeader>
            <CardBody>
              <Stack divider={<StackDivider />} spacing="4">
                <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap="4">
                  <Box>
                    <Text color="gray.500" fontSize="sm">Nome Completo</Text>
                    <Text fontWeight="medium">{displayData.nome}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">CPF</Text>
                    <Text>{displayData.cpf}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">RG</Text>
                    <Text>{displayData.rg}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Data de Nascimento</Text>
                    <Text>{formatDate(displayData.dataNascimento)}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Email</Text>
                    <Text>{displayData.email}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Telefone</Text>
                    <Text>{displayData.telefone}</Text>
                  </Box>
                </Grid>
              </Stack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Status e Informações Rápidas */}
        <GridItem colSpan={1}>
          <Card>
            <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
              <Heading size="md">Status</Heading>
            </CardHeader>
            <CardBody>
              <Stack spacing="4">
                <Box>
                  <Text color="gray.500" fontSize="sm">Situação Atual</Text>
                  <Badge 
                    colorScheme={getStatusColor(displayData.status)} 
                    fontSize="md" 
                    px="2" 
                    py="1" 
                    mt="1"
                  >
                    {displayData.status.toUpperCase()}
                  </Badge>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">Data de Cadastro</Text>
                  <Flex align="center" mt="1">
                    <Icon as={FiCalendar} mr="2" />
                    <Text>{formatDate(displayData.dataCadastro)}</Text>
                  </Flex>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">Última Atualização</Text>
                  <Flex align="center" mt="1">
                    <Icon as={FiCalendar} mr="2" />
                    <Text>{formatDate(displayData.dataAtualizacao)}</Text>
                  </Flex>
                </Box>
                <HStack mt="4">
                  <Button 
                    leftIcon={<Icon as={FiPrinter} />} 
                    colorScheme="brand" 
                    variant="outline" 
                    w="full"
                    onClick={handlePrint}
                  >
                    Imprimir Ficha
                  </Button>
                </HStack>
              </Stack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Dados da CNH */}
        <GridItem colSpan={1}>
          <Card>
            <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
              <Heading size="md">
                <HStack>
                  <Icon as={FiFileText} />
                  <Text>Carteira de Habilitação</Text>
                </HStack>
              </Heading>
            </CardHeader>
            <CardBody>
              <Stack divider={<StackDivider />} spacing="4">
                <Box>
                  <Text color="gray.500" fontSize="sm">Número CNH</Text>
                  <Text>{displayData.cnh.numero}</Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">Categoria</Text>
                  <Badge colorScheme="blue" fontSize="md" px="2" py="1" mt="1">
                    {displayData.cnh.categoria}
                  </Badge>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">Data de Emissão</Text>
                  <Text>{formatDate(displayData.cnh.dataEmissao)}</Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">Validade</Text>
                  <Text>{formatDate(displayData.cnh.validade)}</Text>
                </Box>
              </Stack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Endereço */}
        <GridItem colSpan={1}>
          <Card>
            <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
              <Heading size="md">
                <HStack>
                  <Icon as={FiTruck} />
                  <Text>Endereço</Text>
                </HStack>
              </Heading>
            </CardHeader>
            <CardBody>
              <Stack divider={<StackDivider />} spacing="4">
                <Box>
                  <Text color="gray.500" fontSize="sm">Rua</Text>
                  <Text>{displayData.endereco.rua}, {displayData.endereco.numero}</Text>
                </Box>
                {displayData.endereco.complemento && (
                  <Box>
                    <Text color="gray.500" fontSize="sm">Complemento</Text>
                    <Text>{displayData.endereco.complemento}</Text>
                  </Box>
                )}
                <Box>
                  <Text color="gray.500" fontSize="sm">Bairro</Text>
                  <Text>{displayData.endereco.bairro}</Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">Cidade/Estado</Text>
                  <Text>{displayData.endereco.cidade}/{displayData.endereco.estado}</Text>
                </Box>
                <Box>
                  <Text color="gray.500" fontSize="sm">CEP</Text>
                  <Text>{displayData.endereco.cep}</Text>
                </Box>
              </Stack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Observações */}
        <GridItem colSpan={{ base: 1, lg: 3 }}>
          <Card>
            <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
              <Heading size="md">Observações</Heading>
            </CardHeader>
            <CardBody>
              <Text>
                {displayData.observacoes || 'Nenhuma observação registrada para este motorista.'}
              </Text>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default DetalhesMotorista;