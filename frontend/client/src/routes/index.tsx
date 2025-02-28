// src/routes/index.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Flex, Spinner } from '@chakra-ui/react';

// Layout principal
import Layout from '../components/Layout';

// Páginas carregadas diretamente (essenciais)
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

// Páginas carregadas com lazy loading
const ListaMotoristas = lazy(() => import('../pages/Motoristas/ListaMotoristas'));
const DetalhesMotorista = lazy(() => import('../pages/Motoristas/DetalhesMotorista'));
const FormularioMotorista = lazy(() => import('../pages/Motoristas/FormularioMotorista'));

// Componentes temporários para módulos ainda não implementados
const LoadingFallback = () => (
  <Flex justify="center" align="center" h="500px">
    <Spinner size="xl" color="brand.500" thickness="4px" />
  </Flex>
);

const ModuloEmConstrucao = ({ nome }: { nome: string }) => (
  <Flex direction="column" align="center" justify="center" h="70vh">
    <Spinner size="xl" color="brand.500" thickness="4px" mb="4" />
    <h2>Módulo de {nome} em desenvolvimento</h2>
    <p>Esta funcionalidade estará disponível em breve.</p>
  </Flex>
);

// Páginas temporárias para módulos não implementados
const ListaVeiculos = () => <ModuloEmConstrucao nome="Veículos" />;
const DetalhesVeiculo = () => <ModuloEmConstrucao nome="Detalhes de Veículo" />;
const FormularioVeiculo = () => <ModuloEmConstrucao nome="Cadastro de Veículo" />;

const ListaProprietarios = () => <ModuloEmConstrucao nome="Proprietários" />;
const DetalhesProprietario = () => <ModuloEmConstrucao nome="Detalhes de Proprietário" />;
const FormularioProprietario = () => <ModuloEmConstrucao nome="Cadastro de Proprietário" />;

const ListaEmpresas = () => <ModuloEmConstrucao nome="Empresas" />;
const DetalhesEmpresa = () => <ModuloEmConstrucao nome="Detalhes de Empresa" />;
const FormularioEmpresa = () => <ModuloEmConstrucao nome="Cadastro de Empresa" />;

const ListaConsultas = () => <ModuloEmConstrucao nome="Consultas" />;
const DetalhesConsulta = () => <ModuloEmConstrucao nome="Detalhes de Consulta" />;

const ListaUsuarios = () => <ModuloEmConstrucao nome="Usuários" />;
const FormularioUsuario = () => <ModuloEmConstrucao nome="Cadastro de Usuário" />;

const Relatorios = () => <ModuloEmConstrucao nome="Relatórios" />;

// Componente de rota privada
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    // Redireciona para login se não estiver autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rota pública de login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas privadas dentro do layout */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Rotas de Motoristas */}
          <Route path="motoristas" element={<ListaMotoristas />} />
          <Route path="motoristas/:id" element={<DetalhesMotorista />} />
          <Route path="motoristas/novo" element={<FormularioMotorista />} />
          <Route path="motoristas/:id/editar" element={<FormularioMotorista />} />
          
          {/* Rotas de Veículos */}
          <Route path="veiculos" element={<ListaVeiculos />} />
          <Route path="veiculos/:id" element={<DetalhesVeiculo />} />
          <Route path="veiculos/novo" element={<FormularioVeiculo />} />
          <Route path="veiculos/:id/editar" element={<FormularioVeiculo />} />
          
          {/* Rotas de Proprietários */}
          <Route path="proprietarios" element={<ListaProprietarios />} />
          <Route path="proprietarios/:id" element={<DetalhesProprietario />} />
          <Route path="proprietarios/novo" element={<FormularioProprietario />} />
          <Route path="proprietarios/:id/editar" element={<FormularioProprietario />} />
          
          {/* Rotas de Empresas */}
          <Route path="empresas" element={<ListaEmpresas />} />
          <Route path="empresas/:id" element={<DetalhesEmpresa />} />
          <Route path="empresas/novo" element={<FormularioEmpresa />} />
          <Route path="empresas/:id/editar" element={<FormularioEmpresa />} />
          
          {/* Rotas de Consultas */}
          <Route path="consultas" element={<ListaConsultas />} />
          <Route path="consultas/:id" element={<DetalhesConsulta />} />
          
          {/* Rotas de Usuários */}
          <Route path="usuarios" element={<ListaUsuarios />} />
          <Route path="usuarios/novo" element={<FormularioUsuario />} />
          <Route path="usuarios/:id/editar" element={<FormularioUsuario />} />
          
          {/* Rota de Relatórios */}
          <Route path="relatorios" element={<Relatorios />} />
          
          {/* Rota não encontrada */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;