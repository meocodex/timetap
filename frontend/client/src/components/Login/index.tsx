// src/pages/Login/index.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Flex,
  Stack,
  Box,
  Heading,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/Login/LoginForm';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { colorMode } = useColorMode();
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/dashboard';

  // Redireciona se o usuário já estiver autenticado
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <Flex 
      minH="100vh" 
      align="center" 
      justify="center" 
      bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}
    >
      <Stack spacing="8" mx="auto" py="12" px="6">
        <Stack align="center">
          <Heading fontSize="3xl" color="brand.500">
            Spartakus
          </Heading>
          <Text fontSize="lg" color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Sistema de Gestão de Transportes
          </Text>
        </Stack>
        
        <LoginForm />
      </Stack>
    </Flex>
  );
};

export default Login;