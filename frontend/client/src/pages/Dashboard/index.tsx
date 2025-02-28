// src/pages/Dashboard/index.tsx
import React from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Flex,
  Icon,
  Badge,
  useColorMode,
  Card,
  CardHeader,
  CardBody,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { FiUser, FiTruck, FiClipboard, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useQuery } from 'react-query';
import { api } from '../../services/api';

// Interface para estruturar os dados da API
interface DashboardStats {
  motoristas: number;
  veiculos: number;
  consultasPendentes: number;
}

interface Activity {
  id: number;
  tipo: string;
  descricao: string;
  status: 'pendente' | 'concluído' | 'cancelado';
  data: string;
}

// Componente de cartão estatístico
interface StatCardProps {
  title: string;
  stat: string;
  icon: React.ReactNode;
  change?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, stat, icon, change }) => {
  const { colorMode } = useColorMode();
  const textColor = colorMode === 'light' ? 'gray.600' : 'gray.300';

  return (
    <Card>
      <CardBody>
        <Flex justifyContent="space-between">
          <Box>
            <StatLabel fontWeight="medium" color={textColor}>
              {title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="medium">
              {stat}
            </StatNumber>
            {change !== undefined && (
              <StatHelpText>
                <Flex align="center">
                  <Icon
                    as={change > 0 ? FiArrowUp : FiArrowDown}
                    color={change > 0 ? 'green.500' : 'red.500'}
                    mr="1"
                  />
                  <Text>
                    {Math.abs(change).toFixed(1)}% em relação ao mês anterior
                  </Text>
                </Flex>
              </StatHelpText>
            )}
          </Box>
          <Box
            p="3"
            bg={colorMode === 'light' ? 'gray.100' : 'gray.700'}
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {icon}
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { colorMode } = useColorMode();

  // Carregar estatísticas para o dashboard
  const { data: statsData, isLoading: statsLoading } = useQuery<DashboardStats>(
    'dashboardStats',
    async () => {
      try {
        const response = await api.get('/dashboard/stats');
        return response.data;
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Dados de fallback para desenvolvimento
        return {
          motoristas: 48,
          veiculos: 36,
          consultasPendentes: 12,
        };
      }
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
    }
  );

  // Carregar atividades recentes
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery<Activity[]>(
    'recentActivities',
    async () => {
      try {
        const response = await api.get('/dashboard/activities');
        return response.data;
      } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        // Dados de fallback para desenvolvimento
        return [
          {
            id: 1,
            tipo: 'Consulta',
            descricao: 'Consulta de motorista realizada',
            status: 'concluído',
            data: new Date().toISOString(),
          },
          {
            id: 2,
            tipo: 'Cadastro',
            descricao: 'Novo veículo cadastrado',
            status: 'concluído',
            data: new Date().toISOString(),
          },
          {
            id: 3,
            tipo: 'Atualização',
            descricao: 'Dados de empresa atualizados',
            status: 'pendente',
            data: new Date().toISOString(),
          },
        ];
      }
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
    }
  );

  const bgCardColor = colorMode === 'light' ? 'white' : 'gray.800';

  return (
    <Box pt="5" pb="10">
      <Box mb="8">
        <Heading size="lg" mb="6">
          Dashboard
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap="5" mb="8">
          <Skeleton isLoaded={!statsLoading}>
            <StatCard
              title="Motoristas"
              stat={statsData?.motoristas.toString() || '0'}
              icon={<Icon as={FiUser} boxSize={8} />}
              change={5.3}
            />
          </Skeleton>
          <Skeleton isLoaded={!statsLoading}>
            <StatCard
              title="Veículos"
              stat={statsData?.veiculos.toString() || '0'}
              icon={<Icon as={FiTruck} boxSize={8} />}
              change={2.1}
            />
          </Skeleton>
          <Skeleton isLoaded={!statsLoading}>
            <StatCard
              title="Consultas Pendentes"
              stat={statsData?.consultasPendentes.toString() || '0'}
              icon={<Icon as={FiClipboard} boxSize={8} />}
              change={-3.2}
            />
          </Skeleton>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="8">
          {/* Atividades Recentes */}
          <Card bg={bgCardColor}>
            <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
              <Heading size="md">
                Atividades Recentes
              </Heading>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Tipo</Th>
                      <Th>Descrição</Th>
                      <Th>Status</Th>
                      <Th>Data</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {activitiesLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <Tr key={index}>
                          <Td><Skeleton height="20px" /></Td>
                          <Td><Skeleton height="20px" /></Td>
                          <Td><Skeleton height="20px" /></Td>
                          <Td><Skeleton height="20px" /></Td>
                        </Tr>
                      ))
                    ) : activitiesData && activitiesData.length > 0 ? (
                      activitiesData.map((activity) => (
                        <Tr key={activity.id}>
                          <Td>{activity.tipo}</Td>
                          <Td>{activity.descricao}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                activity.status === 'concluído'
                                  ? 'green'
                                  : activity.status === 'pendente'
                                  ? 'yellow'
                                  : 'red'
                              }
                            >
                              {activity.status}
                            </Badge>
                          </Td>
                          <Td>{new Date(activity.data).toLocaleDateString()}</Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={4} textAlign="center">Nenhuma atividade recente</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

          {/* Estatísticas Adicionais */}
          <Card bg={bgCardColor}>
            <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
              <Heading size="md">
                Estatísticas de Desempenho
              </Heading>
            </CardHeader>
            <CardBody>
              <Text>
                Gráficos e estatísticas detalhadas serão implementados em breve.
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default Dashboard;