// src/pages/Motoristas/ListaMotoristas.tsx
import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Spinner,
  useToast,
  useColorMode,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiSearch, 
  FiEye, 
  FiEdit, 
  FiTrash2,
  FiDownload
} from 'react-icons/fi';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';

// Interface para motorista
interface Motorista {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo' | 'pendente';
  cnh: {
    numero: string;
    categoria: string;
    validade: string;
  };
}

// Interface para resposta paginada
interface PaginatedResponse {
  data: Motorista[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

const ListaMotoristas: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { colorMode } = useColorMode();
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<number | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  // Consulta para buscar motoristas
  const { data, isLoading, isError } = useQuery<PaginatedResponse>(
    ['motoristas', page, searchTerm],
    async () => {
      try {
        const response = await api.get('/motoristas', {
          params: {
            page,
            limit: 10,
            search: searchTerm,
          },
        });
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        throw error;
      }
    },
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5, // 5 minutos
    }
  );

  // Mutação para excluir motorista
  const deleteMutation = useMutation(
    async (id: number) => {
      return api.delete(`/motoristas/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('motoristas');
        toast({
          title: 'Motorista excluído',
          description: 'O motorista foi excluído com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
      },
      onError: (error) => {
        console.error('Erro ao excluir motorista:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Ocorreu um erro ao excluir o motorista.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  // Função para confirmar exclusão
  const handleDeleteClick = (id: number) => {
    setSelectedMotoristaId(id);
    onOpen();
  };

  // Função para realizar exclusão
  const handleDelete = () => {
    if (selectedMotoristaId) {
      deleteMutation.mutate(selectedMotoristaId);
    }
  };

  // Função para definir cor do status
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

  // Renderiza dados de fallback para desenvolvimento quando não tiver API
  const mockData: PaginatedResponse = {
    data: [
      {
        id: 1,
        nome: 'João Silva',
        cpf: '123.456.789-00',
        email: 'joao@email.com',
        telefone: '(11) 99999-9999',
        status: 'ativo',
        cnh: {
          numero: '12345678900',
          categoria: 'E',
          validade: '2025-12-31',
        },
      },
      {
        id: 2,
        nome: 'Maria Oliveira',
        cpf: '987.654.321-00',
        email: 'maria@email.com',
        telefone: '(11) 88888-8888',
        status: 'pendente',
        cnh: {
          numero: '09876543211',
          categoria: 'D',
          validade: '2024-10-15',
        },
      },
    ],
    meta: {
      totalItems: 2,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    },
  };

  // Usar dados de fallback quando API não estiver disponível
  const displayData = data || mockData;

  return (
    <Box>
      <PageHeader
        title="Motoristas"
        subtitle="Gerenciamento de motoristas cadastrados no sistema"
        actionButton={{
          label: "Novo Motorista",
          icon: <Icon as={FiPlus} />,
          onClick: () => navigate('/motoristas/novo')
        }}
      />

      <Flex
        direction={{ base: 'column', md: 'row' }}
        mb="6"
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        gap="4"
      >
        <Box width={{ base: '100%', md: '50%', lg: '40%' }}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Buscar por nome ou CPF"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Box>

        <Button
          leftIcon={<Icon as={FiDownload} />}
          variant="outline"
          colorScheme="brand"
          onClick={() => {
            // Lógica para exportar dados
            toast({
              title: 'Exportação iniciada',
              description: 'Seus dados estão sendo exportados.',
              status: 'info',
              duration: 3000,
              isClosable: true,
            });
          }}
        >
          Exportar Dados
        </Button>
      </Flex>

      <Box
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius="lg"
        boxShadow="sm"
        overflow="hidden"
      >
        {isLoading ? (
          <Flex justify="center" align="center" p="10">
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
        ) : isError ? (
          <Flex justify="center" align="center" p="10" direction="column">
            <Text fontSize="lg" mb="4" color="red.500">
              Erro ao carregar dados
            </Text>
            <Button 
              onClick={() => queryClient.invalidateQueries('motoristas')}
              colorScheme="brand"
            >
              Tentar novamente
            </Button>
          </Flex>
        ) : (
          <>
            <TableContainer>
              <Table variant="simple">
                <Thead bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>CPF</Th>
                    <Th>CNH</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayData.data.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py="6">
                        Nenhum motorista encontrado.
                      </Td>
                    </Tr>
                  ) : (
                    displayData.data.map((motorista) => (
                      <Tr key={motorista.id}>
                        <Td fontWeight="medium">{motorista.nome}</Td>
                        <Td>{motorista.cpf}</Td>
                        <Td>
                          {motorista.cnh.numero} ({motorista.cnh.categoria})
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(motorista.status)}>
                            {motorista.status}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack gap="2">
                            <IconButton
                              aria-label="Ver detalhes"
                              icon={<Icon as={FiEye} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/motoristas/${motorista.id}`)}
                            />
                            <IconButton
                              aria-label="Editar"
                              icon={<Icon as={FiEdit} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/motoristas/${motorista.id}/editar`)}
                            />
                            {user?.role === 'admin' && (
                              <IconButton
                                aria-label="Excluir"
                                icon={<Icon as={FiTrash2} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeleteClick(motorista.id)}
                              />
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            {/* Paginação */}
            {displayData.meta.totalPages > 1 && (
              <Flex justify="flex-end" p="4">
                <HStack>
                  <Text fontSize="sm" color="gray.500" mr="2">
                    Página {page} de {displayData.meta.totalPages}
                  </Text>
                  <Button
                    size="sm"
                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                    isDisabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => 
                      setPage((old) => Math.min(old + 1, displayData.meta.totalPages))
                    }
                    isDisabled={page === displayData.meta.totalPages}
                  >
                    Próximo
                  </Button>
                </HStack>
              </Flex>
            )}
          </>
        )}
      </Box>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Motorista
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={deleteMutation.isLoading}
                loadingText="Excluindo..."
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ListaMotoristas;