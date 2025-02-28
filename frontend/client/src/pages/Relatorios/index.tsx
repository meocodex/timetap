// src/pages/Relatorios/index.tsx
import React, { useState } from 'react';
import {
  Box,
  Heading,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Select,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Flex,
  Text,
  Icon,
  HStack,
  useColorMode,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiDownload, FiPieChart, FiBarChart2, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';

const Relatorios: React.FC = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [tipoRelatorio, setTipoRelatorio] = useState('motoristas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [formato, setFormato] = useState('pdf');
  const [isLoading, setIsLoading] = useState(false);

  // Simulação de geração de relatório
  const gerarRelatorio = () => {
    setIsLoading(true);
    
    // Simulando um tempo de processamento
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: 'Relatório gerado',
        description: `O relatório de ${tipoRelatorio} foi gerado com sucesso.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }, 2000);
  };

  return (
    <Box>
      <PageHeader
        title="Relatórios"
        subtitle="Geração de relatórios e análises do sistema"
      />

      <Tabs colorScheme="brand" variant="enclosed">
        <TabList>
          <Tab><Icon as={FiBarChart2} mr="2" /> Relatórios Padrão</Tab>
          <Tab><Icon as={FiPieChart} mr="2" /> Análises</Tab>
          <Tab><Icon as={FiTrendingUp} mr="2" /> Desempenho</Tab>
        </TabList>

        <TabPanels>
          {/* Aba de Relatórios Padrão */}
          <TabPanel p="0" pt="4">
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing="6">
              {/* Card de Filtros */}
              <Card>
                <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
                  <Heading size="md">Filtros</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Stack spacing="4">
                    <FormControl>
                      <FormLabel>Tipo de Relatório</FormLabel>
                      <Select
                        value={tipoRelatorio}
                        onChange={(e) => setTipoRelatorio(e.target.value)}
                      >
                        <option value="motoristas">Motoristas</option>
                        <option value="veiculos">Veículos</option>
                        <option value="consultas">Consultas</option>
                        <option value="empresas">Empresas</option>
                        <option value="financeiro">Financeiro</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Data Início</FormLabel>
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Data Fim</FormLabel>
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Formato</FormLabel>
                      <Select
                        value={formato}
                        onChange={(e) => setFormato(e.target.value)}
                      >
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                      </Select>
                    </FormControl>

                    <Button
                      mt="4"
                      colorScheme="brand"
                      leftIcon={<Icon as={FiDownload} />}
                      onClick={gerarRelatorio}
                      isLoading={isLoading}
                      loadingText="Gerando..."
                    >
                      Gerar Relatório
                    </Button>
                  </Stack>
                </CardBody>
              </Card>

              {/* Card de Relatórios Recentes */}
              <Card gridColumn={{ lg: 'span 2' }}>
                <CardHeader bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
                  <Heading size="md">Relatórios Recentes</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Tipo</Th>
                        <Th>Data</Th>
                        <Th>Gerado por</Th>
                        <Th>Formato</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Motoristas Ativos</Td>
                        <Td>
                          <HStack>
                            <Icon as={FiCalendar} />
                            <Text>22/06/2023</Text>
                          </HStack>
                        </Td>
                        <Td>Administrador</Td>
                        <Td>
                          <Badge colorScheme="red">PDF</Badge>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            leftIcon={<Icon as={FiDownload} />}
                            colorScheme="brand"
                            variant="outline"
                          >
                            Download
                          </Button>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Veículos por Estado</Td>
                        <Td>
                          <HStack>
                            <Icon as={FiCalendar} />
                            <Text>18/06/2023</Text>
                          </HStack>
                        </Td>
                        <Td>Administrador</Td>
                        <Td>
                          <Badge colorScheme="green">Excel</Badge>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            leftIcon={<Icon as={FiDownload} />}
                            colorScheme="brand"
                            variant="outline"
                          >
                            Download
                          </Button>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Consultas Finalizadas</Td>
                        <Td>
                          <HStack>
                            <Icon as={FiCalendar} />
                            <Text>15/06/2023</Text>
                          </HStack>
                        </Td>
                        <Td>João Silva</Td>
                        <Td>
                          <Badge colorScheme="blue">CSV</Badge>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            leftIcon={<Icon as={FiDownload} />}
                            colorScheme="brand"
                            variant="outline"
                          >
                            Download
                          </Button>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* Aba de Análises */}
          <TabPanel>
            <Flex
              justify="center"
              align="center"
              direction="column"
              h="300px"
              bg={colorMode === 'light' ? 'white' : 'gray.800'}
              p="6"
              borderRadius="lg"
              boxShadow="sm"
            >
              <Icon as={FiPieChart} boxSize="16" color="gray.400" mb="4" />
              <Text fontSize="xl" fontWeight="bold" mb="2">
                Análises em Desenvolvimento
              </Text>
              <Text color="gray.500" textAlign="center">
                Os gráficos e dashboards analíticos estão sendo desenvolvidos e serão 
                disponibilizados em breve.
              </Text>
            </Flex>
          </TabPanel>

          {/* Aba de Desempenho */}
          <TabPanel>
            <Flex
              justify="center"
              align="center"
              direction="column"
              h="300px"
              bg={colorMode === 'light' ? 'white' : 'gray.800'}
              p="6"
              borderRadius="lg"
              boxShadow="sm"
            >
              <Icon as={FiTrendingUp} boxSize="16" color="gray.400" mb="4" />
              <Text fontSize="xl" fontWeight="bold" mb="2">
                Métricas de Desempenho em Desenvolvimento
              </Text>
              <Text color="gray.500" textAlign="center">
                As métricas de desempenho e indicadores estão sendo desenvolvidos e serão 
                disponibilizados em breve.
              </Text>
            </Flex>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Relatorios;